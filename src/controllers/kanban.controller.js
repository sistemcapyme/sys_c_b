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
    const { encargadoId } = req.query;

    const where = { activo: true };
    if (usuario.rol === 'encargado_jcf') {
      where.encargadoId = usuario.id;
    } else if (encargadoId) {
      where.encargadoId = Number(encargadoId);
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where,
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
    const {
      nombre,
      apellido,
      nombreCompleto,
      credencialesJcf,
      linkPapeles,
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
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    const nuevoAprendiz = await prisma.jovenJcf.create({
      data: {
        nombre: nombreFinal,
        apellido: apellidoFinal,
        nombreCompleto: nombreCompleto || null,
        credencialesJcf: credencialesJcf || null,
        linkPapeles: linkPapeles || null,
        nombreNegocio: nombreNegocio || null,
        linkImagenNegocio: linkImagenNegocio || null,
        encargadoId: encargadoId ? Number(encargadoId) : (usuarioActual.rol === 'encargado_jcf' ? usuarioActual.id : null),
        usuarioId: usuarioActual.id || null,
        estadoKanban: 'PENDIENTE',
        activo: true
      },
      include: {
        encargado: { select: { nombre: true, apellido: true } }
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

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });

    const {
      nombre,
      apellido,
      nombreCompleto,
      credencialesJcf,
      linkPapeles,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    let nombreFinal = nombre || nombreCompleto;
    let apellidoFinal = apellido;

    if (!nombreFinal && nombreCompleto) {
      const partes = nombreCompleto.split(' ');
      nombreFinal = partes[0] || '';
      apellidoFinal = partes.slice(1).join(' ') || '';
    }

    const dataUpdate = {};
    if (nombreFinal) dataUpdate.nombre = nombreFinal;
    if (apellidoFinal !== undefined) dataUpdate.apellido = apellidoFinal;
    if (nombreCompleto !== undefined) dataUpdate.nombreCompleto = nombreCompleto;
    if (credencialesJcf !== undefined) dataUpdate.credencialesJcf = credencialesJcf;
    if (linkPapeles !== undefined) dataUpdate.linkPapeles = linkPapeles;
    if (nombreNegocio !== undefined) dataUpdate.nombreNegocio = nombreNegocio;
    if (linkImagenNegocio !== undefined) dataUpdate.linkImagenNegocio = linkImagenNegocio;
    if (encargadoId !== undefined) dataUpdate.encargadoId = encargadoId ? Number(encargadoId) : null;

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id },
      data: dataUpdate,
      include: {
        encargado: { select: { nombre: true, apellido: true } }
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

    const { estadoKanban } = req.body;

    if (!estadoKanban || !ESTADO_API_A_DB[estadoKanban]) {
      return res.status(400).json({ success: false, message: 'Estado de kanban inválido' });
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
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
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
    const { urlRecurso } = req.body;
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
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
    await prisma.jovenJcf.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerAprendicesKanban,
  obtenerAprendizPorId,
  crearAprendizKanban,
  actualizarAprendizKanban,
  actualizarEstadoKanban,
  toggleActivoAprendiz,
  actualizarRecurso,
  eliminarAprendiz
};