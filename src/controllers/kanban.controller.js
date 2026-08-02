const { prisma } = require('../config/database');

const ESTADO_API_A_DB = {
  ENCARGADO: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  POSTULADO: 'POSTULADO'
};

const ESTADO_DB_A_API = {
  PENDIENTE: 'ENCARGADO',
  EN_PROCESO: 'EN_PROCESO',
  POSTULADO: 'POSTULADO'
};

const ROLES_ENCARGABLES = ['admin', 'lider_jcf', 'encargado_jcf'];

const mapAprendizSalida = (aprendiz) => {
  if (!aprendiz) return aprendiz;
  return {
    ...aprendiz,
    estadoKanban: ESTADO_DB_A_API[aprendiz.estadoKanban] || aprendiz.estadoKanban
  };
};

const obtenerAprendicesKanban = async (req, res, next) => {
  try {
    const usuario = req.usuario || req.user || {};
    const usuarioId = Number(usuario.id);

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where: { activo: true, encargadoId: usuarioId },
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      },
      orderBy: { fechaRegistro: 'desc' }
    });

    res.status(200).json({ success: true, data: aprendices.map(mapAprendizSalida) });
  } catch (error) {
    next(error);
  }
};

const obtenerAprendizPorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const aprendiz = await prisma.jovenJcf.findUnique({
      where: { id },
      include: {
        encargado: { select: { nombre: true, apellido: true } },
        negocio: true
      }
    });
    if (!aprendiz) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    res.status(200).json({ success: true, data: mapAprendizSalida(aprendiz) });
  } catch (error) {
    next(error);
  }
};

const crearAprendizKanban = async (req, res, next) => {
  try {
    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const {
      nombreCompleto,
      credencialesJcf,
      linkPapeles,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    if (!nombreCompleto || !nombreCompleto.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre completo es requerido' });
    }
    if (!credencialesJcf || !credencialesJcf.trim()) {
      return res.status(400).json({ success: false, message: 'El usuario y contraseña de la plataforma JCF son requeridos' });
    }
    if (!linkPapeles || !linkPapeles.trim()) {
      return res.status(400).json({ success: false, message: 'El link de documentos es requerido' });
    }
    if (!nombreNegocio || !nombreNegocio.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del negocio es requerido' });
    }
    if (!linkImagenNegocio || !linkImagenNegocio.trim()) {
      return res.status(400).json({ success: false, message: 'El link de información del negocio es requerido' });
    }
    if (!encargadoId) {
      return res.status(400).json({ success: false, message: 'Debe seleccionar un encargado' });
    }

    const encargadoIdNum = Number(encargadoId);
    const encargado = await prisma.usuario.findFirst({ where: { id: encargadoIdNum, rol: { in: ROLES_ENCARGABLES }, activo: true } });
    if (!encargado) {
      return res.status(400).json({ success: false, message: 'El encargado no existe o no tiene un rol válido' });
    }

    const partesNombre = nombreCompleto.trim().split(' ');
    const nombreFinal = partesNombre[0] || '';
    const apellidoFinal = partesNombre.slice(1).join(' ') || '';

    const nuevoAprendiz = await prisma.jovenJcf.create({
      data: {
        nombre: nombreFinal,
        apellido: apellidoFinal,
        nombreCompleto: nombreCompleto.trim(),
        credencialesJcf: credencialesJcf.trim(),
        linkPapeles: linkPapeles.trim(),
        nombreNegocio: nombreNegocio.trim(),
        linkImagenNegocio: linkImagenNegocio.trim(),
        encargadoId: encargadoIdNum,
        usuarioId: usuarioId,
        estadoKanban: 'PENDIENTE',
        activo: true
      },
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true, rol: true } }
      }
    });

    res.status(201).json({ success: true, data: mapAprendizSalida(nuevoAprendiz) });
  } catch (error) {
    next(error);
  }
};

const actualizarAprendizKanban = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);
    const esAdminOLider = ['admin', 'lider_jcf'].includes(usuarioActual.rol);

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    if (!esAdminOLider && existente.encargadoId !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso sobre este registro' });
    }

    const {
      nombreCompleto,
      credencialesJcf,
      linkPapeles,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId,
      estadoKanban
    } = req.body;

    const dataUpdate = {};

    if (nombreCompleto !== undefined) {
      const partesNombre = nombreCompleto.trim().split(' ');
      dataUpdate.nombre = partesNombre[0] || '';
      dataUpdate.apellido = partesNombre.slice(1).join(' ') || '';
      dataUpdate.nombreCompleto = nombreCompleto.trim();
    }
    if (credencialesJcf !== undefined) dataUpdate.credencialesJcf = credencialesJcf;
    if (linkPapeles !== undefined) dataUpdate.linkPapeles = linkPapeles;
    if (nombreNegocio !== undefined) dataUpdate.nombreNegocio = nombreNegocio;
    if (linkImagenNegocio !== undefined) dataUpdate.linkImagenNegocio = linkImagenNegocio;

    if (encargadoId !== undefined) {
      if (encargadoId) {
        const encargadoIdNum = Number(encargadoId);
        const encargado = await prisma.usuario.findFirst({ where: { id: encargadoIdNum, rol: { in: ROLES_ENCARGABLES }, activo: true } });
        if (!encargado) {
          return res.status(400).json({ success: false, message: 'El encargado no existe o no tiene un rol válido' });
        }
        dataUpdate.encargadoId = encargadoIdNum;
      } else {
        dataUpdate.encargadoId = null;
      }
    }

    if (estadoKanban !== undefined) {
      if (!ESTADO_API_A_DB[estadoKanban]) {
        return res.status(400).json({ success: false, message: 'Estado de kanban inválido' });
      }
      dataUpdate.estadoKanban = ESTADO_API_A_DB[estadoKanban];
    }

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id },
      data: dataUpdate,
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true, rol: true } }
      }
    });

    res.status(200).json({ success: true, data: mapAprendizSalida(aprendizActualizado) });
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoKanban = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);
    const esAdminOLider = ['admin', 'lider_jcf'].includes(usuarioActual.rol);
    const { estadoKanban } = req.body;

    if (!estadoKanban || !ESTADO_API_A_DB[estadoKanban]) {
      return res.status(400).json({ success: false, message: 'Estado de kanban inválido' });
    }

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    if (!esAdminOLider && existente.encargadoId !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso sobre este registro' });
    }

    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { estadoKanban: ESTADO_API_A_DB[estadoKanban] }
    });

    res.status(200).json({ success: true, data: mapAprendizSalida(actualizado) });
  } catch (error) {
    next(error);
  }
};

const toggleActivoAprendiz = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);
    const esAdminOLider = ['admin', 'lider_jcf'].includes(usuarioActual.rol);
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    if (!esAdminOLider && existente.encargadoId !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso sobre este registro' });
    }
    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { activo: !existente.activo }
    });
    res.status(200).json({ success: true, data: mapAprendizSalida(actualizado) });
  } catch (error) {
    next(error);
  }
};

const actualizarRecurso = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);
    const esAdminOLider = ['admin', 'lider_jcf'].includes(usuarioActual.rol);
    const { urlRecurso } = req.body;
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    if (!esAdminOLider && existente.encargadoId !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso sobre este registro' });
    }
    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { urlRecurso: urlRecurso || null }
    });
    res.status(200).json({ success: true, data: mapAprendizSalida(actualizado) });
  } catch (error) {
    next(error);
  }
};

const eliminarAprendiz = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const usuarioActual = req.usuario || req.user || {};
    const usuarioId = Number(usuarioActual.id);
    const esAdminOLider = ['admin', 'lider_jcf'].includes(usuarioActual.rol);
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    if (!esAdminOLider && existente.encargadoId !== usuarioId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso sobre este registro' });
    }
    await prisma.jovenJcf.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const obtenerTodosAprendices = async (req, res, next) => {
  try {
    const usuario = req.usuario || req.user || {};
    const usuarioId = Number(usuario.id);

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where: { activo: true },
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true, rol: true } }
      },
      orderBy: { fechaRegistro: 'desc' }
    });

    res.status(200).json({ success: true, data: aprendices.map(mapAprendizSalida) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerAprendicesKanban,
  obtenerTodosAprendices,
  obtenerAprendizPorId,
  crearAprendizKanban,
  actualizarAprendizKanban,
  actualizarEstadoKanban,
  toggleActivoAprendiz,
  actualizarRecurso,
  eliminarAprendiz
};