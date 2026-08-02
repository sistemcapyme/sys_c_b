const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDistribuciones = async (req, res, next) => {
  try {
    const distribuciones = await prisma.joven.findMany({
      include: {
        encargado: true,
        lider: true
      }
    });
    res.status(200).json(distribuciones);
  } catch (error) {
    next(error);
  }
};

const asignarJoven = async (req, res, next) => {
  try {
    const { jovenId, encargadoId, liderId } = req.body;
    const asignacion = await prisma.joven.update({
      where: { id: Number(jovenId) },
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
  getDistribuciones,
  asignarJoven
};