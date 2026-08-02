const { prisma } = require('../config/database');

const ROLES_ENCARGABLES = ['admin', 'lider_jcf', 'encargado_jcf'];

const obtenerDistribucion = async (req, res, next) => {
  try {
    const { encargadoId, sinAsignar } = req.query;
    const where = {};
    if (sinAsignar === 'true') {
      where.encargadoId = null;
    } else if (encargadoId) {
      where.encargadoId = Number(encargadoId);
    }
    const jovenes = await prisma.jovenJcf.findMany({
      where,
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { fechaRegistro: 'desc' }
    });
    res.status(200).json({ success: true, data: jovenes });
  } catch (error) {
    next(error);
  }
};

const obtenerEncargadosDisponibles = async (req, res, next) => {
  try {
    const encargados = await prisma.usuario.findMany({
      where: { rol: { in: ROLES_ENCARGABLES }, activo: true },
      select: { id: true, nombre: true, apellido: true, rol: true }
    });
    res.status(200).json({ success: true, data: encargados });
  } catch (error) {
    next(error);
  }
};

const asignarEncargado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const { encargadoId } = req.body;
    if (encargadoId) {
      const encargado = await prisma.usuario.findFirst({ where: { id: Number(encargadoId), rol: { in: ROLES_ENCARGABLES }, activo: true } });
      if (!encargado) return res.status(400).json({ success: false, message: 'Encargado no válido' });
    }
    const joven = await prisma.jovenJcf.update({
      where: { id },
      data: { encargadoId: encargadoId ? Number(encargadoId) : null },
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true } }
      }
    });
    res.status(200).json({ success: true, data: joven });
  } catch (error) {
    next(error);
  }
};

const asignarEncargadoLote = async (req, res, next) => {
  try {
    const { jovenIds, encargadoId } = req.body;
    if (!Array.isArray(jovenIds) || jovenIds.length === 0) {
      return res.status(400).json({ success: false, message: 'jovenIds debe ser un arreglo con al menos un elemento' });
    }
    const resultado = await prisma.jovenJcf.updateMany({
      where: { id: { in: jovenIds.map(Number) } },
      data: { encargadoId: encargadoId ? Number(encargadoId) : null }
    });
    res.status(200).json({ success: true, actualizados: resultado.count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerDistribucion,
  obtenerEncargadosDisponibles,
  asignarEncargado,
  asignarEncargadoLote
};