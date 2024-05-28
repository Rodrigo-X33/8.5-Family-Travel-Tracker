import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "f5NNW7uu",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUser = 0;
let currentId = 1;
let error;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = $1", [currentId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function requireUsers() {
  const result = await db.query("SELECT * FROM users");
  const users = [];
  result.rows.forEach((user)=>{
    users.push(user);
  })
  return users;
}


app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const usuarios = await requireUsers();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    nowUser: currentUser,
    users: usuarios,
    color: 'teal',
    error: error
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const userId = req.body.id;
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      const notInDatabase = await db.query(
        "SELECT country_code FROM visited_countries WHERE user_id = $1 AND country_code = $2;", [userId, countryCode]
      );
      
      console.log(notInDatabase.rows)
      console.log(notInDatabase.rows.length);
      if(notInDatabase.rows.length > 0){
        error = "Este país ya fue agregado";
      }
      else{
        await db.query(
          "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
          [countryCode, userId]
        );
        error = null;
      }
      
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/")
    }
  } catch (err) {
    console.log(err);
    error = "El país que escribió no existe, por favor vuelva a intentarlo";
    res.redirect("/");
  }
});

//Este debería utilizarse para renderizar los paises según el usuario
app.post("/user", async (req, res) => {
  if (req.body["add"]){
    res.render("new.ejs")
  }
  else{
    const user = req.body["user"];
    console.log(user)
    const identifier = parseInt(user);
    const users = await requireUsers();
    const nowUser = users.find(user=>user.id == identifier);

    currentId = nowUser.id;
    const arrayUser = users.indexOf(nowUser);
    currentUser = arrayUser;
    res.redirect("/");
  }
});

//Este debería utilizarse para añadir un nuevo usuario  
app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  const name = req.body.name;
  const color = req.body.color;

  console.log(name);
  console.log(color);

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
    [name, color]
  );
  
  const currentUserId = result.rows[0].id;
  const users = await requireUsers();
  const nowUser = users.find(user=>user.id == currentUserId);
  const arrayUser = users.indexOf(nowUser);
  currentUser = arrayUser;
  currentId = currentUserId;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});







/*

  ""código posiblemente util"""

  if (req.body["add"]){
    res.render("new.ejs")
  }
  const identifier = parseInt(req.body["user"]);
  const nowUser = users.find(user=>user.id == identifier);
  const countries = await checkVisisted();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    NowUser: nowUser,
    users: users,
    color: "teal",
  });
*/
