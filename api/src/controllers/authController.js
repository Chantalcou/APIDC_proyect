// controllers/userController.js
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const sequelize = require("../config/db.js");

// Configurar el cliente JWKS de Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`, // Asegúrate de definir AUTH0_DOMAIN en tu archivo .env
});

// Función para obtener la clave pública
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Middleware para verificar el token de Auth0
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token no válido" });
    }

    // Si el token es válido, lo añadimos a la solicitud
    req.user = decoded;
    next();
  });
};

// Registro de usuario (aquí ya no necesitamos manejar la contraseña)
const registerUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    const isAdmin = email === "chantiicou@gmail.com";

    const newUser = await User.create({
      name,
      email,
      isAdmin,
    });

    return res
      .status(201)
      .json({ message: "Usuario registrado con éxito", user: newUser });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
};

const loginUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Credenciales incorrectas" });
    }

    // Si no tiene la propiedad isAdmin pero es el correo del admin, lo establecemos
    if (email === "chantiicou@gmail.com" && !user.isAdmin) {
      user.isAdmin = true;
      console.log(user.isAdmin);
      await user.save();
    }

    // Comparar la contraseña con el hash almacenado
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: "Credenciales incorrectas" });
    // }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin }, // Incluir si es admin en el token
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error en el inicio de sesión" });
  }
};

// Función para eliminar un usuario por email
const deleteUserByEmail = async (email) => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("Conexión a la base de datos establecida correctamente.");

    // Buscar al usuario por email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`Usuario con email "${email}" no encontrado.`);
      return;
    }

    // Eliminar al usuario
    await user.destroy();
    console.log(
      `Usuario con email "${email}" ha sido eliminado correctamente.`
    );
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
    console.log("Conexión a la base de datos cerrada.");
  }
};

// deleteUserByEmail("chantiicou@gmail.com");

module.exports = { registerUser, loginUser, verifyToken };
