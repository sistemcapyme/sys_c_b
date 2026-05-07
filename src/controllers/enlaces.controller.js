const { prisma } = require('../config/database');
const cloudinary = require('cloudinary').v2;

// Usamos la misma función de subida que en catálogos
const uploadToCloudinary = async (fileBuffer, mimetype) => {
  const b64 = Buffer.from(fileBuffer).toString('base64');
  const dataURI = `data:${mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, { folder: 'recursos' });
  return result.secure_url;
};

// Extractor dinámico del public ID para borrar en Cloudinary
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const fileWithExt = parts.pop();
    const folder = parts.pop();
    const lastDotIndex = fileWithExt.lastIndexOf('.');
    const filename = lastDotIndex !== -1 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
    return `${folder}/${filename}`;
  } catch (error) {
    return null;
  }
};

const log = async (usuarioId, accion, registroId, descripcion, ip) => {
  try {
    await prisma.historialAccion.create({
      data: { usuarioId, accion, tablaAfectada: 'enlaces', registroId, descripcion, ipAddress: ip || null },
    });
  } catch {}
};

const genRef = () =>
  `RESR${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0')}`.slice(0, 18);

const obtenerEnlaces = async (req, res) => {
  try {
    const { activo, tipo, categoria, visiblePara } = req.query;
    const where = {};

    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;

    if (req.user?.rol === 'cliente') {
      where.visiblePara = { in: ['todos', 'clientes'] };
    } else if (visiblePara) {
      where.visiblePara = visiblePara;
    }

    const enlaces = await prisma.enlaceRecurso.findMany({
      where,
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        _count: { select: { accesos: true } },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    const uid = req.user?.id;
    const esCliente = req.user?.rol === 'cliente';

    const data = await Promise.all(
      enlaces.map(async (e) => {
        let miAcceso = null;
        if (esCliente && uid) {
          const acceso = await prisma.accesoRecurso.findFirst({
            where: { enlaceId: e.id, usuarioId: uid },
            include: { pago: { select: { estadoPago: true, referencia: true, monto: true } } },
          });
          if (acceso) {
            miAcceso = {
              estado: acceso.estado,
              estadoPago: acceso.pago?.estadoPago || null,
              pago: acceso.pago,
            };
          }
        }
        return { ...e, accesosCount: e._count.accesos, _count: undefined, miAcceso };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('[obtenerEnlaces]', error);
    res.status(500).json({ success: false, message: 'Error al obtener recursos', error: error.message });
  }
};

const obtenerEnlacePorId = async (req, res) => {
  try {
    const enlace = await prisma.enlaceRecurso.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { creador: { select: { id: true, nombre: true, apellido: true } } },
    });
    if (!enlace) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    res.json({ success: true, data: enlace });
  } catch (error) {
    console.error('[obtenerEnlacePorId]', error);
    res.status(500).json({ success: false, message: 'Error al obtener recurso', error: error.message });
  }
};

const crearEnlace = async (req, res) => {
  try {
    const { titulo, descripcion, url, tipo, categoria, visiblePara, costo, formato } = req.body;

    if (!titulo || !url || !formato) {
      return res.status(400).json({ success: false, message: 'Título, URL y formato son requeridos' });
    }

    let imagenUrl = null;

    if (req.file) {
      imagenUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const data = {
      titulo,
      url,
      tipo: tipo || 'otro',
      formato,
      visiblePara: visiblePara || 'todos',
      costo: costo != null ? parseFloat(costo) : 0,
      creadoPor: req.user.id,
      imagenUrl,
    };

    if (descripcion) data.descripcion = descripcion;
    if (categoria) data.categoria = categoria;

    const enlace = await prisma.enlaceRecurso.create({
      data,
      include: { creador: { select: { id: true, nombre: true, apellido: true } } },
    });

    await log(req.user.id, 'CREATE', enlace.id, `Recurso creado: "${enlace.titulo}"`, req.ip);

    res.status(201).json({ success: true, message: 'Recurso creado exitosamente', data: enlace });
  } catch (error) {
    console.error('[crearEnlace]', error);
    res.status(500).json({ success: false, message: 'Error al crear recurso', error: error.message });
  }
};

const actualizarEnlace = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, descripcion, url, tipo, categoria, visiblePara, costo, formato } = req.body;

    const recursoExistente = await prisma.enlaceRecurso.findUnique({ where: { id } });
    if (!recursoExistente) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });

    let imagenUrl = recursoExistente.imagenUrl;

    if (req.file) {
      if (recursoExistente.imagenUrl) {
        const publicId = extractPublicId(recursoExistente.imagenUrl);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      imagenUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (url !== undefined) data.url = url;
    if (tipo !== undefined) data.tipo = tipo;
    if (formato !== undefined) data.formato = formato;
    if (visiblePara !== undefined) data.visiblePara = visiblePara;
    if (costo !== undefined) data.costo = parseFloat(costo) || 0;
    if (descripcion !== undefined) data.descripcion = descripcion || null;
    if (categoria !== undefined) data.categoria = categoria || null;
    data.imagenUrl = imagenUrl;

    const enlace = await prisma.enlaceRecurso.update({
      where: { id },
      data,
      include: { creador: { select: { id: true, nombre: true, apellido: true } } },
    });

    await log(req.user.id, 'UPDATE', enlace.id, `Recurso actualizado: "${enlace.titulo}"`, req.ip);

    res.json({ success: true, message: 'Recurso actualizado exitosamente', data: enlace });
  } catch (error) {
    console.error('[actualizarEnlace]', error);
    res.status(500).json({ success: false, message: 'Error al actualizar recurso', error: error.message });
  }
};

const eliminarEnlace = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recurso = await prisma.enlaceRecurso.findUnique({ where: { id } });

    if (!recurso) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });

    if (recurso.imagenUrl) {
      const publicId = extractPublicId(recurso.imagenUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await prisma.enlaceRecurso.delete({ where: { id } });
    await log(req.user.id, 'DELETE', id, `Recurso eliminado: "${recurso.titulo}"`, req.ip);

    res.json({ success: true, message: 'Recurso eliminado exitosamente' });
  } catch (error) {
    console.error('[eliminarEnlace]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar recurso', error: error.message });
  }
};

const toggleActivoEnlace = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ex = await prisma.enlaceRecurso.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });

    const enlace = await prisma.enlaceRecurso.update({
      where: { id },
      data: { activo: !ex.activo },
      include: { creador: { select: { id: true, nombre: true, apellido: true } } },
    });

    await log(
      req.user.id, 'TOGGLE_ACTIVO', enlace.id,
      `Recurso ${enlace.activo ? 'activado' : 'desactivado'}: "${enlace.titulo}"`, req.ip
    );

    res.json({
      success: true,
      message: `Recurso ${enlace.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: enlace,
    });
  } catch (error) {
    console.error('[toggleActivoEnlace]', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
  }
};

const solicitarAcceso = async (req, res) => {
  try {
    const enlaceId = parseInt(req.params.id);
    const uid = req.user.id;

    const enlace = await prisma.enlaceRecurso.findUnique({ where: { id: enlaceId } });
    if (!enlace) return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    if (!enlace.activo) return res.status(400).json({ success: false, message: 'Este recurso no está disponible' });

    const costo = enlace.costo ? parseFloat(enlace.costo) : 0;
    const requierePago = costo > 0;

    let acceso = await prisma.accesoRecurso.findFirst({
      where: { enlaceId, usuarioId: uid },
      include: { pago: true },
    });

    // LÓGICA BLINDADA: Reutilizar acceso si ya existe para evitar error P2002
    if (acceso) {
      if (acceso.estado === 'activo') {
        return res.status(400).json({ success: false, message: 'Ya tienes acceso a este recurso' });
      }

      // Si el acceso existe y está estrictamente pendiente de pago (reanudación normal)
      if (acceso.estado === 'pendiente' && acceso.pago?.estadoPago === 'pendiente') {
        return res.json({
          success: true,
          message: 'Reanudando pago pendiente',
          requierePago: true,
          pagoInfo: {
            referencia: acceso.pago.referencia,
            monto: acceso.pago.monto,
            tituloRecurso: enlace.titulo,
          },
          esReanudacion: true,
        });
      }

      // Si el acceso existe, pero el pago fue rechazado, cancelado o no existe:
      // Lo actualizamos a pendiente en vez de intentar crear otro registro.
      acceso = await prisma.accesoRecurso.update({
        where: { id: acceso.id },
        data: { estado: requierePago ? 'pendiente' : 'activo' },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
          enlace: { select: { titulo: true, url: true } },
        }
      });
    } else {
      // Si el acceso NO existe, entonces sí lo creamos tranquilamente.
      acceso = await prisma.accesoRecurso.create({
        data: {
          enlaceId,
          usuarioId: uid,
          estado: requierePago ? 'pendiente' : 'activo',
        },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
          enlace: { select: { titulo: true, url: true } },
        },
      });
    }

    let pagoInfo = null;

    if (requierePago) {
      const ref = genRef();
      
      // Upsert (Actualizar si existe, Crear si no existe) para el registro de Pago
      const pagoExistente = await prisma.pagoAccesoRecurso.findUnique({
         where: { accesoId: acceso.id }
      });

      if (pagoExistente) {
         await prisma.pagoAccesoRecurso.update({
            where: { id: pagoExistente.id },
            data: { referencia: ref, monto: costo, tipoPago: 'mercadopago', estadoPago: 'pendiente' }
         });
      } else {
         await prisma.pagoAccesoRecurso.create({
            data: {
              accesoId: acceso.id,
              referencia: ref,
              monto: costo,
              tipoPago: 'mercadopago',
              estadoPago: 'pendiente',
            },
         });
      }

      pagoInfo = { referencia: ref, monto: costo, tituloRecurso: enlace.titulo };

      const admins = await prisma.usuario.findMany({
        where: { rol: 'admin', activo: true },
        select: { id: true },
      });
      
      if (admins.length > 0) {
        await prisma.notificacion.createMany({
          data: admins.map((a) => ({
            usuarioId: a.id,
            tipo: 'acceso_recurso_pendiente',
            titulo: 'Nueva solicitud de acceso',
            mensaje: `${acceso.usuario.nombre} ${acceso.usuario.apellido} solicitó acceso a "${enlace.titulo}".`,
            leida: false,
          })),
        });
      }
    } else {
      await prisma.notificacion.create({
        data: {
          usuarioId: uid,
          tipo: 'acceso_otorgado',
          titulo: 'Acceso otorgado',
          mensaje: `Ya tienes acceso a "${enlace.titulo}".`,
          leida: false,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: requierePago ? 'Solicitud registrada. Completa tu pago.' : '¡Acceso otorgado!',
      data: acceso,
      requierePago,
      pagoInfo,
      esReanudacion: false,
    });
  } catch (error) {
    console.error('[solicitarAcceso]', error);
    res.status(500).json({ success: false, message: 'Error al solicitar acceso', error: error.message });
  }
};

const confirmarPorReferencia = async (req, res) => {
  try {
    const { referencia } = req.body;
    if (!referencia) return res.status(400).json({ success: false, message: 'Referencia requerida' });

    const pago = await prisma.pagoAccesoRecurso.findUnique({
      where: { referencia: String(referencia) },
      include: {
        acceso: {
          include: {
            usuario: { select: { id: true } },
            enlace: { select: { titulo: true, url: true } },
          },
        },
      },
    });

    if (!pago) return res.json({ success: true, message: 'Pago no encontrado', yaConfirmado: false });
    if (pago.estadoPago === 'confirmado') return res.json({ success: true, message: 'Ya confirmado', yaConfirmado: true });

    await prisma.$transaction([
      prisma.pagoAccesoRecurso.update({
        where: { id: pago.id },
        data: { estadoPago: 'confirmado', fechaConfirmacion: new Date() },
      }),
      prisma.accesoRecurso.update({
        where: { id: pago.accesoId },
        data: { estado: 'activo' },
      }),
    ]);

    await prisma.notificacion.create({
      data: {
        usuarioId: pago.acceso.usuario.id,
        tipo: 'acceso_otorgado',
        titulo: 'Acceso confirmado',
        mensaje: `Tu pago para "${pago.acceso.enlace.titulo}" fue confirmado. ¡Ya tienes acceso!`,
        leida: false,
      },
    });

    res.json({ success: true, message: 'Acceso confirmado exitosamente', yaConfirmado: true, urlDrive: pago.acceso.enlace.url });
  } catch (error) {
    console.error('[confirmarPorReferencia]', error);
    res.status(500).json({ success: false, message: 'Error al confirmar acceso', error: error.message });
  }
};

const obtenerAccesos = async (req, res) => {
  try {
    const accesos = await prisma.accesoRecurso.findMany({
      where: { enlaceId: parseInt(req.params.id) },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true } },
        pago: { select: { estadoPago: true, referencia: true, monto: true, mercadoPagoId: true } },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });
    res.json({ success: true, data: accesos });
  } catch (error) {
    console.error('[obtenerAccesos]', error);
    res.status(500).json({ success: false, message: 'Error al obtener accesos', error: error.message });
  }
};

const obtenerMiPago = async (req, res) => {
  try {
    const enlaceId = parseInt(req.params.id);
    const acceso = await prisma.accesoRecurso.findFirst({
      where: { enlaceId, usuarioId: req.user.id },
      include: {
        pago: { select: { estadoPago: true, referencia: true, monto: true } },
        enlace: { select: { titulo: true } },
      },
    });

    if (!acceso) return res.status(404).json({ success: false, message: 'Sin acceso registrado' });
    if (!acceso.pago) return res.json({ success: true, data: { tienePago: false } });

    res.json({
      success: true,
      data: {
        tienePago: true,
        referencia: acceso.pago.referencia,
        monto: acceso.pago.monto,
        estadoPago: acceso.pago.estadoPago,
        tituloRecurso: acceso.enlace.titulo,
      },
    });
  } catch (error) {
    console.error('[obtenerMiPago]', error);
    res.status(500).json({ success: false, message: 'Error al obtener pago', error: error.message });
  }
};

module.exports = {
  obtenerEnlaces,
  obtenerEnlacePorId,
  crearEnlace,
  actualizarEnlace,
  eliminarEnlace,
  toggleActivoEnlace,
  solicitarAcceso,
  confirmarPorReferencia,
  obtenerAccesos,
  obtenerMiPago,
};