const { prisma } = require('../config/database');

const getAprendices = async (req, res, next) => {
  try {
    const { encargadoId, sinAsignar } = req.query;
    const where = {};
    if (sinAsignar === 'true') {
      where.encargadoId = null;
    } else if (encargadoId) {
      where.encargadoId = Number(encargadoId);
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where,
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { fechaRegistro: 'desc' }
    });

    res.status(200).json({ success: true, data: aprendices });
  } catch (error) {
    next(error);
  }
};

const asignarAprendiz = async (req, res, next) => {
  try {
    const { aprendizId, encargadoId } = req.body;

    if (!aprendizId) {
      return res.status(400).json({ success: false, message: 'aprendizId es requerido' });
    }

    const asignacion = await prisma.jovenJcf.update({
      where: { id: Number(aprendizId) },
      data: {
        encargadoId: encargadoId ? Number(encargadoId) : null
      },
      include: {
        encargado: { select: { id: true, nombre: true, apellido: true } }
      }
    });

    res.status(200).json({ success: true, data: asignacion });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAprendices,
  asignarAprendiz
};