import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLideres = async (req, res, next) => {
  try {
    const lideres = await prisma.usuario.findMany({
      where: { rol: 'LIDER' }
    });
    res.status(200).json(lideres);
  } catch (error) {
    next(error);
  }
};

export const getLiderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lider = await prisma.usuario.findUnique({
      where: { id: Number(id), rol: 'LIDER' }
    });
    if (!lider) {
      return res.status(404).json({ message: 'Líder no encontrado' });
    }
    res.status(200).json(lider);
  } catch (error) {
    next(error);
  }
};

export const createLider = async (req, res, next) => {
  try {
    const data = req.body;
    const nuevoLider = await prisma.usuario.create({
      data: {
        ...data,
        rol: 'LIDER'
      }
    });
    res.status(201).json(nuevoLider);
  } catch (error) {
    next(error);
  }
};

export const updateLider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const liderActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });
    res.status(200).json(liderActualizado);
  } catch (error) {
    next(error);
  }
};

export const deleteLider = async (req, res, next) => {
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