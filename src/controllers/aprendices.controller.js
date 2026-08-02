const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAprendices = async (req, res, next) => {
  try {
    const aprendices = await prisma.jcf.findMany();
    res.status(200).json(aprendices);
  } catch (error) {
    next(error);
  }
};

const asignarAprendiz = async (req, res, next) => {
  try {
    const { aprendizId, encargadoId, liderId } = req.body;
    const asignacion = await prisma.jcf.update({
      where: { id: Number(aprendizId) },
      data: {
        encargadoId: encargadoId ? Number(encargadoId) : null,
        liderId: liderId ? Number(liderId) : null
      }
    });
    res.status(200).json(asignacion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAprendices,
  asignarAprendiz
};