const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const includeBase = {
  usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
  negocio: true,
  postulacion: true
};

const ESTADOS_KANBAN_VALIDOS = ['ENCARGADO', 'EN_PROCESO', 'POSTULADO'];

const obtenerJovenes = async (req, res) => {
  try {
    const { activo, buscar, postulacionId, estadoGeo, municipioNegocio, estatus } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (postulacionId) where.postulacionId = parseInt(postulacionId);
    if (estatus) where.estatus = estatus;

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { apellido: { contains: buscar } },
        { curp: { contains: buscar } },
        { correo: { contains: buscar } },
      ];
    }

    if (estadoGeo || municipioNegocio) {
      where.negocio = {};
      if (estadoGeo) where.negocio.estado = { contains: estadoGeo };
      if (municipioNegocio) where.negocio.ciudad = { contains: municipioNegocio };
    }

    if (req.user?.rol === 'cliente') {
      where.usuarioId = req.user.id;
    }

    const jovenes = await prisma.jovenJcf.findMany({
      where,
      include: includeBase,
      orderBy: { fechaRegistro: 'desc' }
    });

    res.json({ success: true, data: jovenes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener jóvenes JCF', detalle: error.message });
  }
};

const obtenerJovenPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const joven = await prisma.jovenJcf.findUnique({
      where: { id },
      include: includeBase
    });

    if (!joven) return res.status(404).json({ success: false, message: 'Joven no encontrado' });

    if (req.user?.rol === 'cliente' && joven.usuarioId !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver este registro' });
    }

    res.json({ success: true, data: joven });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const actualizarJoven = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Joven no encontrado' });

    const { activo, urlRecurso, usuarioId: usuarioIdBody, negocioId, municipio, estatus, tarjetaEntregada, horarios, horarioConfirmado, fechaInicio, fechaTermino, ...dataActualizar } = req.body;

    const joven = await prisma.jovenJcf.update({
      where: { id },
      data: {
        ...dataActualizar,
        estatus: estatus !== undefined ? estatus : existente.estatus,
        fechaInicio: fechaInicio !== undefined ? (fechaInicio ? new Date(fechaInicio).toISOString() : null) : existente.fechaInicio,
        fechaTermino: fechaTermino !== undefined ? (fechaTermino ? new Date(fechaTermino).toISOString() : null) : existente.fechaTermino,
        tarjetaEntregada: tarjetaEntregada !== undefined ? tarjetaEntregada : existente.tarjetaEntregada,
        horarios: horarios !== undefined ? horarios : existente.horarios,
        horarioConfirmado: horarioConfirmado !== undefined ? horarioConfirmado : existente.horarioConfirmado,
        ...(negocioId !== undefined ? { negocioId: negocioId ? parseInt(negocioId) : null } : {}),
      },
      include: includeBase
    });

    res.json({ success: true, message: 'Joven actualizado exitosamente', data: joven });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const toggleActivoJoven = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Joven no encontrado' });

    const joven = await prisma.jovenJcf.update({
      where: { id },
      data: { activo: !existente.activo },
      include: includeBase
    });

    const accionTexto = joven.activo ? 'activado' : 'desactivado';

    res.json({ success: true, message: `Joven ${accionTexto} exitosamente`, data: joven });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const actualizarRecurso = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const { urlRecurso } = req.body;

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Joven no encontrado' });

    const joven = await prisma.jovenJcf.update({
      where: { id },
      data: { urlRecurso: urlRecurso || null },
      include: includeBase
    });

    res.json({ success: true, message: 'Recurso actualizado exitosamente', data: joven });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const asignarEncargado = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const { encargadoId } = req.body;

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { encargadoId: encargadoId ? parseInt(encargadoId) : null },
      include: includeBase
    });

    res.status(200).json({ success: true, data: aprendizActualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const obtenerLideres = async (req, res) => {
  try {
    const lideres = await prisma.usuario.findMany({
      where: { rol: 'lider_jcf' },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true }
    });
    res.json({ success: true, data: lideres });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al obtener líderes', detalle: error.message });
  }
};

const crearLider = async (req, res) => {
  try {
    const { nombre, apellido, email, password, activo } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoLider = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol: 'lider_jcf',
        activo: activo !== undefined ? activo : true
      }
    });

    res.status(201).json({ success: true, data: nuevoLider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al crear líder', detalle: error.message });
  }
};

const crearNegocio = async (req, res) => {
  try {
    const { usuario_id, nombre_negocio, categoria_id, rfc, direccion, ciudad, estado } = req.body;
    const negocio = await prisma.negocio.create({
      data: {
        usuarioId: parseInt(usuario_id),
        nombreNegocio: nombre_negocio,
        categoriaId: parseInt(categoria_id),
        rfc,
        direccion,
        ciudad,
        estado
      }
    });
    res.status(201).json({ success: true, data: negocio });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const obtenerAprendicesKanban = async (req, res) => {
  try {
    const usuario = req.usuario || req.user || {};

    if (!usuario.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where: { activo: true, encargadoId: usuario.id },
      include: {
        encargado: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { fechaRegistro: 'desc' }
    });

    res.json({ success: true, data: aprendices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al obtener aprendices', detalle: error.message });
  }
};

const crearAprendizKanban = async (req, res) => {
  try {
    const usuarioActual = req.usuario || req.user || {};

    const {
      nombre,
      apellido,
      nombreCompleto,
      usuarioPrograma,
      passwordPrograma,
      credencialesJcf,
      linkDocumentos,
      linkPapeles,
      linkNegocio,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    let nombreFinal = nombre || nombreCompleto;
    let apellidoFinal = apellido || '';

    if (!nombreFinal && nombreCompleto) {
      const partes = nombreCompleto.split(' ');
      nombreFinal = partes[0] || '';
      apellidoFinal = partes.slice(1).join(' ') || '';
    }

    if (!nombreFinal) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }

    const nuevoAprendiz = await prisma.jovenJcf.create({
      data: {
        nombre: nombreFinal,
        apellido: apellidoFinal,
        usuarioPrograma: usuarioPrograma || null,
        passwordPrograma: passwordPrograma || credencialesJcf || null,
        linkDocumentos: linkDocumentos || linkPapeles || null,
        linkNegocio: linkNegocio || nombreNegocio || null,
        linkImagenNegocio: linkImagenNegocio || null,
        encargadoId: encargadoId ? Number(encargadoId) : null,
        usuarioId: usuarioActual.id || null,
        estadoKanban: 'ENCARGADO',
        activo: true
      },
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      }
    });

    res.status(201).json({ success: true, data: nuevoAprendiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const actualizarAprendizKanban = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      apellido,
      nombreCompleto,
      usuarioPrograma,
      passwordPrograma,
      credencialesJcf,
      linkDocumentos,
      linkPapeles,
      linkNegocio,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    let nombreFinal = nombre || nombreCompleto;
    let apellidoFinal = apellido || '';

    if (!nombreFinal && nombreCompleto) {
      const partes = nombreCompleto.split(' ');
      nombreFinal = partes[0] || '';
      apellidoFinal = partes.slice(1).join(' ') || '';
    }

    const dataUpdate = {};

    if (nombreFinal) dataUpdate.nombre = nombreFinal;
    if (apellidoFinal) dataUpdate.apellido = apellidoFinal;
    if (usuarioPrograma !== undefined) dataUpdate.usuarioPrograma = usuarioPrograma;
    if (passwordPrograma !== undefined) dataUpdate.passwordPrograma = passwordPrograma;
    if (credencialesJcf !== undefined) dataUpdate.passwordPrograma = credencialesJcf;
    if (linkDocumentos !== undefined) dataUpdate.linkDocumentos = linkDocumentos;
    if (linkPapeles !== undefined) dataUpdate.linkDocumentos = linkPapeles;
    if (linkNegocio !== undefined) dataUpdate.linkNegocio = linkNegocio;
    if (nombreNegocio !== undefined) dataUpdate.linkNegocio = nombreNegocio;
    if (linkImagenNegocio !== undefined) dataUpdate.linkImagenNegocio = linkImagenNegocio;
    if (encargadoId !== undefined) dataUpdate.encargadoId = encargadoId ? Number(encargadoId) : null;

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      }
    });

    res.json({ success: true, data: aprendizActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const actualizarEstadoKanban = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const { estadoKanban } = req.body;

    if (!ESTADOS_KANBAN_VALIDOS.includes(estadoKanban)) {
      return res.status(400).json({ success: false, message: 'Estado de kanban inválido' });
    }

    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { estadoKanban }
    });

    res.json({ success: true, data: actualizado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno al actualizar estado', detalle: error.message });
  }
};

const crearJoven = async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron datos válidos' });
    }

    const nombre = data.nombre || data.nombres || data.nombreCompleto || null;
    const apellido = data.apellido || data.apellidos || null;
    const correo = data.correo || data.email || null;
    const telefono = data.telefono || null;
    const curp = data.curp || null;
    const negocioId = data.negocioId || data.negocio_id || null;

    if (!nombre) {
      return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
    }

    const nuevoJoven = await prisma.jovenJcf.create({
      data: {
        nombre,
        apellido: apellido || '',
        correo,
        telefono,
        curp,
        negocioId: negocioId ? parseInt(negocioId, 10) : null,
        activo: true
      },
      include: includeBase
    });

    return res.status(201).json({ success: true, data: nuevoJoven });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteAprendiz = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jovenJcf.delete({
      where: { id: parseInt(id, 10) }
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  obtenerJovenes,
  obtenerJovenPorId,
  crearJoven,
  actualizarJoven,
  toggleActivoJoven,
  actualizarRecurso,
  asignarEncargado,
  obtenerLideres,
  crearLider,
  crearNegocio,
  obtenerAprendicesKanban,
  crearAprendizKanban,
  actualizarAprendizKanban,
  actualizarEstadoKanban,
  deleteAprendiz
};