const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const includeBase = {
  usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
  negocio: true,
  postulacion: true
};

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

const obtenerAprendices = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol === 'encargado_jcf' || req.user.rol === 'ENCARGADO_JCF') {
      where.encargadoId = req.user.id;
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where,
      include: {
        negocio: true,
        usuario: {
          select: { id: true, nombre: true, email: true }
        }
      }
    });
    res.status(200).json(aprendices);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
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

const crearJoven = async (req, res) => {
  try {
    const { activo, urlRecurso, usuarioId: usuarioIdBody, negocioId, municipio, estatus, tarjetaEntregada, horarios, horarioConfirmado, fechaInicio, fechaTermino, ...data } = req.body;

    const usuarioId = (['admin', 'colaborador', 'ADMIN', 'COLABORADOR'].includes(req.user?.rol)) && usuarioIdBody
      ? parseInt(usuarioIdBody)
      : req.user?.id;

    const joven = await prisma.jovenJcf.create({
      data: {
        ...data,
        estatus: estatus || 'Por registrar',
        fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
        fechaTermino: fechaTermino ? new Date(fechaTermino).toISOString() : null,
        tarjetaEntregada: tarjetaEntregada || false,
        horarios: horarios || null,
        horarioConfirmado: horarioConfirmado || false,
        usuarioId,
        ...(negocioId ? { negocioId: parseInt(negocioId) } : {}),
      },
      include: includeBase
    });

    res.status(201).json({ success: true, message: 'Joven creado exitosamente', data: joven });
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

const actualizarEstadoKanban = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const { estadoKanban } = req.body;

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { estadoKanban: estadoKanban }
    });
    
    res.status(200).json(aprendizActualizado);
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
      data: { encargadoId: encargadoId ? parseInt(encargadoId) : null }
    });

    res.status(200).json(aprendizActualizado);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno', detalle: error.message });
  }
};

const obtenerLideres = async (req, res) => {
  try {
    const lideres = await prisma.usuario.findMany({
      where: { rol: 'LIDER_JCF' },
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
        rol: 'LIDER_JCF',
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

module.exports = {
  obtenerJovenes,
  obtenerJovenPorId,
  crearJoven,
  actualizarJoven,
  toggleActivoJoven,
  actualizarRecurso,
  obtenerAprendices,
  actualizarEstadoKanban,
  asignarEncargado,
  obtenerLideres,
  crearLider,
  crearNegocio
};