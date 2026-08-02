const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getKanbanAprendices = async (req, res, next) => {
  try {
    const { encargadoId } = req.query;
    const query = encargadoId ? { encargadoId: Number(encargadoId) } : {};
    
    const aprendices = await prisma.jcf.findMany({
      where: query,
      orderBy: { ordenKanban: 'asc' }
    });
    res.status(200).json(aprendices);
  } catch (error) {
    next(error);
  }
};

const updateKanbanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estadoKanban, ordenKanban } = req.body;
    
    const actualizado = await prisma.jcf.update({
      where: { id: Number(id) },
      data: {
        estadoKanban,
        ordenKanban: Number(ordenKanban)
      }
    });
    res.status(200).json(actualizado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKanbanAprendices,
  updateKanbanStatus
};