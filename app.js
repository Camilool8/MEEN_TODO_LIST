const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  family: 4,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  const today = date.getDate();
  Item.find()
    .then((foundItems) => {
      res.render("list", { listTitle: today, newListItems: foundItems });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", (req, res) => {
  let item = req.body.newItem;
  let list = req.body.list;

  if (list === date.getDate()) {
    Item.create({ name: item }).catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOne({ name: list }).then((foundList) => {
      if (!foundList) {
        console.log("List not found");
      } else {
        foundList.items.push({ name: item });
        foundList.save();
        res.redirect("/" + list);
      }
    });
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName
    .toLowerCase()
    .split(/[!@#$%^&*\s()_+\-=\[\]{};':"\\|,.<>\/?]+/)
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
  const list = new List({
    name: customListName,
    items: [],
  });

  List.findOne({ name: customListName }).then((foundList) => {
    if (!foundList) {
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/delete", (req, res) => {
  const item = req.body.delete;
  const listName = req.body.listName;
  if (listName === date.getDate()) {
    Item.findByIdAndDelete(item).catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: item } } }
    ).catch((err) => {
      console.log(err);
    });
    res.redirect("/" + listName);
  }
});

app.post("/search", (req, res) => {
  const search = req.body.search;
  res.redirect("/" + search);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
