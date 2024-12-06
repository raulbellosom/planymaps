import { db } from "../lib/db.js";

// Crear un nuevo contacto
export const createContact = async (req, res) => {
  const { userId, contactId, status } = req.body;

  try {
    const contact = await db.contact.create({
      data: {
        userId,
        contactId,
        status,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los contactos
export const getContacts = async (req, res) => {
  try {
    const contacts = await db.contact.findMany();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un contacto por ID
export const getContactById = async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await db.contact.findUnique({ where: { id } });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un contacto
export const updateContact = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const contact = await db.contact.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un contacto
export const deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    await db.contact.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
