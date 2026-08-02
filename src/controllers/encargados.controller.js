import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEncargados = async (req, res, next) => {
  try {
    const encargados = await prisma.encargado.findMany();
    res.status(200).json(encargados);
  } catch (error) {
    next(error);
  }
};

export const getEncargadoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const encargado = await prisma.encargado.findUnique({
      where: { id: Number(id) }
    });
    if (!encargado) {
      return res.status(404).json({ message: 'Encargado no encontrado' });
    }
    res.status(200).json(encargado);
  } catch (error) {
    next(error);
  }
};

export const createEncargado = async (req, res, next) => {
  try {
    const data = req.body;
    const nuevoEncargado = await prisma.encargado.create({
      data
    });
    res.status(201).json(nuevoEncargado);
  } catch (error) {
    next(error);
  }
};

export const updateEncargado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const encargadoActualizado = await prisma.encargado.update({
      where: { id: Number(id) },
      data
    });
    res.status(200).json(encargadoActualizado);
  } catch (error) {
    next(error);
  }
};

export const deleteEncargado = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.encargado.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};