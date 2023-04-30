const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at localhost port 3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};
initializeDBAndServer();

//validate Data middleware function
const validateFormat = (request, response, next) => {
  let obj;
  let dateQuery;
  console.log(request.method);
  if (request.method === "GET") {
    obj = request.query;
    const { date = "" } = obj;
    dateQuery = date;
  } else {
    obj = request.body;
    const { dueDate = "" } = obj;
    dateQuery = dueDate;
  }

  const { priority = "", status = "", category = "" } = obj;
  const validPriority = ["HIGH", "MEDIUM", "LOW", ""].includes(priority);
  const validStatus = ["TO DO", "IN PROGRESS", "DONE", ""].includes(status);
  const validCategory = ["WORK", "HOME", "LEARNING", ""].includes(category);
  const dueDate = new Date(dateQuery);
  const isValidDate = isValid(dueDate) || dateQuery === "";
  switch (false) {
    case validStatus:
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case validPriority:
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case validCategory:
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValidDate:
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      next();
  }
};

function convertToJson(jsObj) {
  return jsObj.map((jsArray) => {
    let newArray = {
      id: jsArray.id,
      todo: jsArray.todo,
      priority: jsArray.priority,
      status: jsArray.status,
      category: jsArray.category,
      dueDate: jsArray.due_date,
    };
    return newArray;
  });
}

function dateFormatChanger(date) {
  const userDate = new Date(date);
  const year = userDate.getFullYear();
  let month = userDate.getMonth() + 1;
  if (month < 10) {
    month = "0" + month;
  }
  let todate = userDate.getDate();
  if (todate < 10) {
    todate = "0" + todate;
  }
  const finalDate = `${year}-${month}-${todate}`;
  return finalDate;
}

function getUpdateQuery(todo, todoId, clName) {
  const updateCategoryQuery = `
    UPDATE todo
    SET ${clName} = '${todo}'
    WHERE id = ${todoId};
  `;
  return updateCategoryQuery;
}

//API 1 Returns a list of all todos whose status is 'TO DO'

app.get("/todos/", validateFormat, async (request, response) => {
  const {
    search_q = "",
    category = "",
    priority = "",
    status = "",
  } = request.query;
  const selectUserQuery = `
    SELECT *
    FROM todo
    WHERE todo LIKE '%${search_q}%' AND category LIKE '%${category}%'
    AND priority LIKE '%${priority}%' AND status LIKE '%${status}%';  
    `;
  const result = await db.all(selectUserQuery);
  response.send(convertToJson(result));
});

//API 2 Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", validateFormat, async (request, response) => {
  const { todoId } = request.params;
  const selectSpecificTodoQuery = `
    SELECT *
    FROM todo 
    WHERE id = ${todoId};
    `;
  const specificTodoDetails = await db.get(selectSpecificTodoQuery);
  response.send({
    id: specificTodoDetails.id,
    todo: specificTodoDetails.todo,
    priority: specificTodoDetails.priority,
    status: specificTodoDetails.status,
    category: specificTodoDetails.category,
    dueDate: specificTodoDetails.due_date,
  });
});

//API3 Returns a list of all todos with a specific due date in the query parameter
app.get("/agenda/", validateFormat, async (request, response) => {
  const { date } = request.query;
  let dueDate = dateFormatChanger(date);
  const sortBydateQuery = `
  SELECT *
  FROM todo
  WHERE due_date LIKE "${dueDate}";
  `;
  console.log(sortBydateQuery);
  const sortByDateResult = await db.all(sortBydateQuery);
  response.send(convertToJson(sortByDateResult));
});

//API4 Create a todo in the todo table,
app.post("/todos/", validateFormat, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const newDate = dateFormatChanger(dueDate);
  const insertTodoQuery = `
    INSERT INTO todo(id, todo, category, priority, status, due_date)
    VALUES(${id},'${todo}','${category}','${priority}','${status}','${newDate}');
    `;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});
//API5 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", validateFormat, async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  switch (true) {
    case todo !== "":
      await db.run(getUpdateQuery(todo, todoId, "todo"));
      response.send("Todo Updated");
      break;
    case category !== "":
      await db.run(getUpdateQuery(category, todoId, "category"));
      response.send("Category Updated");
      break;
    case dueDate !== "":
      await db.run(getUpdateQuery(dueDate, todoId, "due_date"));
      response.send("Due Date Updated");
      break;
    case priority !== "":
      await db.run(getUpdateQuery(priority, todoId, "priority"));
      response.send("Priority Updated");
      break;
    case status !== "":
      await db.run(getUpdateQuery(status, todoId, "status"));
      response.send("Status Updated");
      break;
    default:
      break;
  }
});

//API6 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};    
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

// const express = require("express");
// const { open } = require("sqlite");
// const sqlite3 = require("sqlite3");
// const path = require("path");
// const dbPath = path.join(__dirname, "todoApplication.db");
// const app = express();
// app.use(express.json());
// let db = null;

// const initializeDBAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     });
//     app.listen(3000, () => {
//       console.log("Server Running aT http://localhost:3000/");
//     });
//   } catch (error) {
//     console.log(`DB Error: ${error.message}`);
//     process.exit(1);
//   }
// };
// initializeDBAndServer();

// // const onlyStatus = (status) => {
// //   return status.status !== undefined;
// // };

// //API 1
// app.get("/todos/", async (request, response) => {
//   let getQuery = "";
//   let data = null;

//   const { priority, status, category, date } = request.query;
//   console.log(status);
//   const c1 = status !== undefined;
//   if (c1) {
//     if (status !== undefined) {
//       const getQuery = `SELECT * FROM todo WHERE status= '${status}';`;
//       const data = await db.all(getQuery);
//       response.send(data);
//     } else {
//       response.status(400);
//       response.send("Invalid Todo Status");
//     }
//   }
// });
