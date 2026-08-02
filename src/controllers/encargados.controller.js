const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const ROL_ENCARGADO = 'encargado_jcf';

const getEncargados = async (req, res, next) => {
  try {
    const { activo, buscar } = req.query;
    const where = { rol: ROL_ENCARGADO };
    if (activo !== undefined) where.activo = activo === 'true';
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { apellido: { contains: buscar } },
        { email: { contains: buscar } }
      ];
    }
    const encargados = await prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: encargados });
  } catch (error) {
    next(error);
  }
};

const getEncargadoById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const encargado = await prisma.usuario.findFirst({
      where: { id, rol: ROL_ENCARGADO },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    if (!encargado) return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    res.status(200).json({ success: true, data: encargado });
  } catch (error) {
    next(error);
  }
};

const createEncargado = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, activo } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y password son requeridos' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const nuevoEncargado = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol: ROL_ENCARGADO,
        activo: activo !== undefined ? activo : true
      },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(201).json({ success: true, data: nuevoEncargado });
  } catch (error) {
    next(error);
  }
};

const updateEncargado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_ENCARGADO } });
    if (!existente) return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
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
    const encargadoActualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: encargadoActualizado });
  } catch (error) {
    next(error);
  }
};

const toggleActivoEncargado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_ENCARGADO } });
    if (!existente) return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    const encargadoActualizado = await prisma.usuario.update({
      where: { id },
      data: { activo: !existente.activo },
      select: { id: true, nombre: true, apellido: true, email: true, activo: true, rol: true }
    });
    res.status(200).json({ success: true, data: encargadoActualizado });
  } catch (error) {
    next(error);
  }
};

const deleteEncargado = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.usuario.findFirst({ where: { id, rol: ROL_ENCARGADO } });
    if (!existente) return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    await prisma.usuario.delete({ where: { id } });
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
  toggleActivoEncargado,
  deleteEncargado
};