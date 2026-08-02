const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const ROL_LIDER = 'lider_jcf';

const getLideres = async (req, res, next) => {
  try {
    const { activo, buscar } = req.query;
    const where = { rol: ROL_LIDER };
    if (activo !== undefined) where.activo = activo === 'true';
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { apellido: { contains: buscar } },
        { email: { contains: buscar } }
      ];
    }
    const lideres = await prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: lideres });
  } catch (error) {
    next(error);
  }
};

const getLiderById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const lider = await prisma.usuario.findFirst({
      where: { id, rol: ROL_LIDER },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    if (!lider) return res.status(404).json({ success: false, message: 'Líder no encontrado' });
    res.status(200).json({ success: true, data: lider });
  } catch (error) {
    next(error);
  }
};

const createLider = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, activo } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y password son requeridos' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const nuevoLider = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol: ROL_LIDER,
        activo: activo !== undefined ? activo : true
      },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(201).json({ success: true, data: nuevoLider });
  } catch (error) {
    next(error);
  }
};

const updateLider = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_LIDER } });
    if (!existente) return res.status(404).json({ success: false, message: 'Líder no encontrado' });
    const { nombre, apellido, email, password, activo } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (apellido !== undefined) data.apellido = apellido;
    if (email !== undefined) data.email = email;
    if (activo !== undefined) data.activo = activo;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }
    const liderActualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: liderActualizado });
  } catch (error) {
    next(error);
  }
};

const toggleActivoLider = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_LIDER } });
    if (!existente) return res.status(404).json({ success: false, message: 'Líder no encontrado' });
    const liderActualizado = await prisma.usuario.update({
      where: { id },
      data: { activo: !existente.activo },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: liderActualizado });
  } catch (error) {
    next(error);
  }
};

const deleteLider = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_LIDER } });
    if (!existente) return res.status(404).json({ success: false, message: 'Líder no encontrado' });
    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLideres,
  getLiderById,
  createLider,
  updateLider,
  toggleActivoLider,
  deleteLider
};