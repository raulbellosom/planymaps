import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const rootRole = await prisma.role.create({
    data: {
      name: "Root",
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "User",
    },
  });

  const guestRole = await prisma.role.create({
    data: {
      name: "Guest",
    },
  });

  const permissions = [
    { name: "view_dashboard", description: "Ver el panel de control" },
    { name: "view_account", description: "Ver la cuenta" },
    { name: "edit_account", description: "Editar información de la cuenta" },
    { name: "change_password", description: "Cambiar contraseña" },
    { name: "change_account_image", description: "Cambiar imagen de perfil" },
    { name: "view_users", description: "Ver usuarios" },
    { name: "create_users", description: "Crear usuarios" },
    { name: "edit_users", description: "Editar usuarios" },
    { name: "delete_users", description: "Eliminar usuarios" },
    { name: "view_roles", description: "Ver roles" },
    { name: "create_roles", description: "Crear roles" },
    { name: "edit_roles", description: "Editar roles" },
    { name: "delete_roles", description: "Eliminar roles" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.create({
        data: perm,
      })
    )
  );

  await Promise.all(
    createdPermissions.map((perm) =>
      prisma.rolePermission.create({
        data: {
          roleId: rootRole.id,
          permissionId: perm.id,
        },
      })
    )
  );

  await Promise.all(
    createdPermissions.map((perm) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      })
    )
  );

  const hashedPasswordAdmin = await bcrypt.hash("adminadmin", 10);
  const hashedPasswordUser = await bcrypt.hash("useruser", 10);

  const uuidUser1 = uuidv4();
  const user1 = await prisma.user.create({
    data: {
      id: uuidUser1,
      firstName: "Planymaps",
      lastName: "Root",
      userName: "root",
      email: "root@planymaps.com",
      password: hashedPasswordAdmin,
      roleId: rootRole.id,
      enabled: true,
    },
  });

  console.log({ user1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
