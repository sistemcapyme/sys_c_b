import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getEncargados = async (req, res, next) => {
  try {
    const encargados = await prisma.usuario.findMany({
      where: { rol: 'encargado_jcf' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        fechaRegistro: true
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });
    res.json(encargados);
  } catch (error) {
    next(error);
  }
};

export const createEncargado = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;
    
    const emailExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (emailExistente) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const nuevoEncargado = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        telefono,
        rol: 'encargado_jcf',
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true
      }
    });
    res.status(201).json(nuevoEncargado);
  } catch (error) {
    next(error);
  }
};

export const updateEncargado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, telefono, activo } = req.body;
    
    if (email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          email,
          NOT: { id: Number(id) }
        }
      });
      if (emailExistente) {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
      }
    }

    const dataToUpdate = { nombre, apellido, email, telefono, activo };
    
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const encargadoActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true
      }
    });
    res.json(encargadoActualizado);
  } catch (error) {
    next(error);
  }
};

export const deleteEncargado = async (req, res, next) => {
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