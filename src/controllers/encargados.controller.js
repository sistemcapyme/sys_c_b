const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getEncargados = async (req, res, next) => {
  try {
    const encargados = await prisma.usuario.findMany({
      where: { rol: 'encargado_jcf' }
    });
    res.status(200).json(encargados);
  } catch (error) {
    next(error);
  }
};

const getEncargadoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const encargado = await prisma.usuario.findUnique({
      where: { id: Number(id), rol: 'encargado_jcf' }
    });
    if (!encargado) {
      return res.status(404).json({ message: 'Encargado no encontrado' });
    }
    res.status(200).json(encargado);
  } catch (error) {
    next(error);
  }
};

const createEncargado = async (req, res, next) => {
  try {
    const data = req.body;
    const nuevoEncargado = await prisma.usuario.create({
      data: {
        ...data,
        rol: 'encargado_jcf'
      }
    });
    res.status(201).json(nuevoEncargado);
  } catch (error) {
    next(error);
  }
};

const updateEncargado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const encargadoActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });
    res.status(200).json(encargadoActualizado);
  } catch (error) {
    next(error);
  }
};

const deleteEncargado = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEncargados,
  getEncargadoById,
  createEncargado,
  updateEncargado,
  deleteEncargado
};