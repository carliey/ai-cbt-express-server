import { comparePasswords, createJWT, hashPassword } from "../modules/auth";
import { exclude } from "../helpers/exclude";
import prisma from "../modules/db";

export const createUser = async (req, res) => {
  try {
    console.log(req.body.password);
    const user = await prisma.testAdministrator.create({
      data: {
        email: req.body.email,
        about: req.body.about,
        name: req.body.name,
        password: await hashPassword(req.body.password),
      },
    });

    console.log(user);
    const token = await createJWT(user);
    res.json({ token, user: user, message: "user created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
};

export const signin = async (req, res) => {
  try {
    const user = await prisma.testAdministrator.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      res.status(401);
      res.json({ message: "Incorrect username or password" });
      return;
    }

    const isValid = await comparePasswords(req.body.password, user.password);

    if (!isValid) {
      res.status(401);
      res.json({ message: "Incorrect username or password" });
      return;
    }

    const token = await createJWT(user);
    const userWithoutPassword = exclude(user, ["password"]);
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.json({ error });
    console.log(error);
  }
};
