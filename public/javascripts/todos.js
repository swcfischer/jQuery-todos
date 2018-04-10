function TodoList() {
  this.todos = [];
  this.all = [];
};

TodoList.prototype.init = function(todoList) {
  const self = this;
    todoList.forEach(function(todo) {
      let currentTodo = new Todo(todo);
      self.todos.push(currentTodo);
    });

    return this;
};


TodoList.prototype.remove = function(id) {
  this.todos = this.todos.filter((todo) => {
    return todo.id !== Number(id);
  });

  this.todos = this.sort();

  this.all = this.all.filter((todo) => {
    return todo.id !== Number(id);
  });
  
};

TodoList.prototype.update = function(inputTodo) {
  this.todos = this.todos.map((todo) => {
    if (todo.id !== inputTodo.id) {
      return todo;
    } else {
      return new Todo(inputTodo);
    }
  });

  this.todos = this.sort();

  this.all = this.all.map((todo) => {
    if (todo.id !== inputTodo.id) {
      return todo;
    } else {
      return new Todo(inputTodo);
    }
  });

};

TodoList.prototype.sort = function() {
  const sorted = this.todos.sort((a, b) => {
    if (a.completed && !b.completed) {
      return 1;
    } else if (!a.completed && b.completed) {
      return -1
    } else if (a.completed === b.completed) {
      return 0
    }
  });

  return sorted;
};

TodoList.prototype.sortedByDate = function() {
  const dates = []; 
  this.all.forEach((todo) => {
    if (!dates.includes(todo.bothDates)) {
      dates.push(todo.bothDates);
    }
  });

  const count = {};

  this.all.forEach(function(todo) {
    count[todo.bothDates] = count[todo.bothDates] || 0;
    count[todo.bothDates] += 1;
  });
  const finalDates = dates.map((date) => {
    return {
      date: date,
      number: count[date]
    };
  });

  
  return {
    both: true,
    total: this.all.length,
    dates: finalDates,
  };
};

TodoList.prototype.sortedByDateCompleted = function() {
  const completedTodos = this.all.filter((todo) => {
    return todo.completed;
  });

  var dates = []; 
  completedTodos.forEach((todo) => {
    if (!dates.includes(todo.bothDates)) {
      if (todo.bothDates === null) {
        dates.push("No Due Date")
      } else {
        dates.push(todo.bothDates);
      }
    }
  });

  const count = {};

  completedTodos.forEach(function(todo) {
    count[todo.bothDates] = count[todo.bothDates] || 0;
    count[todo.bothDates] += 1;
  });
  const finalDates = dates.map((date) => {
    return {
      date: date,
      number: count[date]
    }
  });
  
  return {
    total: completedTodos.length,
    dates: finalDates,
  };
};

TodoList.prototype.findTodoById = function(id) {
  return this.todos.find((todo) => {
    return todo.id === Number(id);
  });
};

function Todo(inputTodo) {
  this.id = inputTodo.id;
  this.title = inputTodo.title;
  this.completed = inputTodo.completed;
  this.month = inputTodo.month;
  this.year = inputTodo.year;
  this.day = inputTodo.day;
  this.description = inputTodo.description;
  this.yearLastTwo = (function() {
     if (inputTodo.year) {
        return inputTodo.year.substr( inputTodo.year.length - 2, 2);
      } else {
        return null;
      }
  })();
  this.bothDates = (function() {
    if (!inputTodo.month || !inputTodo.year) {
      return "No Due Date";
    } else {
      return inputTodo.month + "/" + inputTodo.year.substr( inputTodo.year.length - 2, 2);
    }
  })();
}

(function() {
  const App = {
    scriptTemplates: {},
    todoList: [],
    title: "All Todos",
    todosByDate: {},
    fetchInitialTodos: function() {
      const self = this;
      $.ajax({
        url: "/api/todos",
        success: function(json) {
          self.todoList = new TodoList;
          self.todoList.init(json);
          self.title = "All Todos";
          self.todoList.all = self.todoList.sort();
          self.todoList.todos = self.todoList.sort();
          self.displayTodos(json);
          self.bindMainEvents();
        },
      });
    },

    grabScripts: function() {
      const self = this;
      const scripts = $("script[type='text/x-handlebars-template']");
      scripts.each(function(i, script_element) {
        const script_name = script_element.id;
        const compiled_script_html = Handlebars.compile(script_element.innerHTML);
        

        self.scriptTemplates[script_name] = compiled_script_html;
        if (script_element.getAttribute("data-type")) {
          const partialName = script_element.getAttribute("data-partial-name");
          Handlebars.registerPartial(partialName, compiled_script_html);
        }
        $(this).remove();
      });
    },

    displayTodos: function(todos) {
      const bothContexts = [this.todoList.sortedByDate(), this.todoList.sortedByDateCompleted()];

      $("header").html(this.scriptTemplates.both_todos_template( { list: bothContexts } ) );
      $("main").html(this.scriptTemplates.main_template({
                                                          todos_list: this.todoList.todos,
                                                          title: this.title
                                                        }));
      this.adjustActiveClass();
    },

    init: function() {
      this.grabScripts();
      this.fetchInitialTodos();
    },

    bindMainEvents: function() {
      $("main li div.blue").on("click", this.handleTodoToggle.bind(this));
      $(".show_modal").on("click", this.handleModal.bind(this));
      $("main a.add").on("click", this.handleAddTodoModal.bind(this));
      $("main div.red").on("click", this.handleTodoDelete.bind(this));
      $("header nav li").add("header h1").on("click", this.handleFilter.bind(this));
    },

    bindModalEvents: function() {
      $("form.popup").on("click", "input#save", this.handleFormSubmit.bind(this));
      $("form.popup").on("click", "input#mark_complete", this.handleFormSubmit.bind(this));
      $(".wrapper").on("click", this.closeModal.bind(this));

    },

    bindEditModalEvents: function() {
      $("form.popup").on("click", "input#save", this.handleFormSubmit.bind(this));
      $("form.popup").on("click", "input#mark_complete", this.handleTodoToggle.bind(this));
      $(".wrapper").on("click", this.closeModal.bind(this));

    },

    handleFilter: function(e) {
      e.preventDefault();
      var $target;
      
      if (e.target.tagName === "LI") {
        $target = $(e.target).find("a");
      } else if (e.target.tagName === "SPAN") {
        $target = $(e.target).prev();
        if ($target.length < 1) {
          $target = $(e.target).closest("h1");
        }
      } else {
        $target = $(e.target);
      }

      const title = $target.text(),
            type = $target.closest("nav").attr("class");
      this.todoList.type = type;
      this.filterTodos(title, type);
    },

    handleTodoDelete: function(e) {
      e.preventDefault();
      this.sendDelete(e);
    },

    handleAddTodoModal: function(e) {
      e.preventDefault();
      this.showNewModal(e);
      this.bindModalEvents();
    },

    handleFormSubmit: function(e) {
      e.preventDefault();
      const $form = $(e.target).closest("form");
      var valid;
      if (e.target.getAttribute("id") === "save") {
        valid = this.validateForm($form);
      } else {
        alert("Cannot mark as complete as item has not been created yet!");
      }

      if (valid && $form.attr("data-id")) {
        this.submitEditFormData($form);
      } else if (valid) {
        this.submitFormData($form);
      }
    },

    submitEditFormData: function($form) {
       const data = this.serializeFormData($form),
             self = this,
             id = $form.attr("data-id");

      $.ajax({
        url: "api/todos/" + id,
        type: "PUT",
        data: data,
        success: function(json) {
          self.todoList.update(json);
          self.displayTodos();
          self.bindMainEvents();

        }
      });
    },

    submitFormData: function($form) {
      const data = this.serializeFormData($form),
            self = this;
      $.ajax({
        url: "api/todos",
        type: "POST",
        data: data,
        success: function(json) {
          self.fetchInitialTodos();
        }
      });
    },

    serializeFormData: function($form) {
      const serializeArrayData = $form.serializeArray(),
            data = {};
      
      serializeArrayData.forEach((element) => {
        if (!element.name.match(/(title|description)/) && !element.value.match(/\d+/) ) {
          data[element.name] = null;
        } else {
          data[element.name] = element.value;
        }
      });
      return data;
    },

    handleTodoToggle: function(e) {
      e.preventDefault();
      if (e.target.tagName !== "INPUT") {
        const id = $(e.target).closest("li").attr("data-id");
        this.handleCheckedSubmit(id);
      } else {
        const id = $(e.target).closest("form").attr("data-id");
        if (this.todoList.findTodoById(id).completed) {
          this.displayTodos();
          this.bindMainEvents();
        } else {
          this.handleCheckedSubmit(id);
        }
      }
    },

    handleModal: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const id = $(e.target).closest("li").attr("data-id"),
            todo = this.todoList.findTodoById(id),
            source = this.createEditModalFormDataStructure(todo.month, todo.day, todo.year, todo.description, todo.title, todo.id);

      this.showModal(source);
      this.bindEditModalEvents();
    },

    showModal: function(source) {
      const modal = this.scriptTemplates.modal_template(source);
      $("main").append(modal);
      $(".popup").css({
        top: ($(window).scrollTop() + 190) + "px",
        left: "50%",
        marginLeft: "-320px"
      });
      $("#modal").prop("checked", true);
      $(".wrapper").add(".popup").fadeIn();
    },


    filterTodos: function(title, type) {
      if (title.match(/all/i)) {
        this.fetchInitialTodos();
      } else if (type === undefined) {
        this.filterCompletedTodos();
      } else {
        this.advancedFilterTodo(title, type);
      }
    },

    filterCompletedTodos: function() {
      this.todoList.todos = this.todoList.todos.filter((todo) => {
        return todo.completed;
      });
      

      this.title = "Completed";
      this.displayTodos();
      this.bindMainEvents();
    },

    adjustActiveClass: function() {
      if (this.title === "All Todos") {
        return;
      }

      $(".active").removeClass("active");
      if (this.title === "Completed") {
        $("nav.all-todos").next("h1").addClass("active");
      } else {
        $(`header nav.${this.todoList.type} a:contains(${this.title})`).closest("li").addClass("active");
      }
    },

    advancedFilterTodo: function(title, type) {
      this.todoList.todos = this.todoList.all;
      if (type === "completed-todos") {
        this.todoList.todos = this.todoList.todos.filter((todo) => {
          return todo.completed;
        });
      }


      this.todoList.todos = this.todoList.todos.filter((todo) => {
        return todo.bothDates === title;
      });
      this.todoList.todos = this.todoList.sort();
      this.title = title;
      this.displayTodos();
      this.bindMainEvents();
    },

    handleCheckedSubmit: function(id) {
      this.sendToggleComplete(id);
    },

    sendDelete: function(e) {
      const self = this,
            id = $(e.target).closest("li").attr("data-id");

      $.ajax({
        url: "/api/todos/" + id,
        type: "DELETE",
        success: function(json) {
          self.todoList.remove(id);
          self.displayTodos();
          self.bindMainEvents();
        }
      });
    },

    validateForm: function($form) {
      var check;
      if (!$form.get(0).checkValidity()) {
        $(".error").text("You must provide a title of at least 3 characters");
        check = false
      } else {
        $(".error").text('');
        check = true
      }

      return check;
    },

    closeModal: function(e) {
      e.preventDefault();
      $(".wrapper").add("#modal").add(".popup").fadeOut();
      $(".wrapper").add("#modal").add(".popup").remove();

    },

    sendToggleComplete: function(id) {
      const self = this;
      $.ajax({
        url: `/api/todos/${id}/toggle_completed`,
        type: "POST",
        success: function(json) {
          self.todoList.update(json);
          self.filterTodos(self.title, self.todoList.type)
          self.displayTodos();
          self.bindMainEvents();
        }
      });
    },

    showNewModal: function(e) {
      const source = this.createNewModalFormDataStructure();
      this.showModal(source);
    },

    createDaysDataStructure: function(selected) {
      var x = 1;
      const a = [];

      for (; x < 32; x++) {
        let obj = {};
        obj["day"] = x;
        if (x.toString().length < 2) {
          obj["value"] = "0" + x.toString()
        } else {
          obj["value"] = x.toString();
        }      
        
        if (selected === obj["value"]) {
          obj["selected"] = true;
        }
        a.push(obj);
      }
      return a;
    },

    createMonthsDataStrucutre: function(selected) {
      const months = ["January", "February", "March", 
                    "April", "May", "June", "July", 
                    "August", "September", "October", 
                    "November", "December"];
      var x = 1;
      const a = [];
      
      for (; x < 13; x++) {
        let obj = {};
        obj["month"] = months[x - 1];
        if (x.toString().length < 2) {
          obj["value"] = "0" + x.toString()
        } else {
          obj["value"] = x.toString();
        }
        if (selected === obj["value"]) {
          obj["selected"] = true;
        }
        a.push(obj);
      }

      return a;
    },

    createYearsDataStructure: function(selected) {
      var x = 2018;
      const a = [];
      
      for (; x < 2026; x++) {
        let obj = {};
        obj["year"] = x;
        obj["value"] = x;
        if (Number(selected) === x) {
          obj["selected"] = true;
        }
        a.push(obj);
      }

      return a;
    },

    createNewModalFormDataStructure: function() {
      const obj = {};

      obj["days"] = this.createDaysDataStructure();
      obj["years"] = this.createYearsDataStructure();
      obj["months"] = this.createMonthsDataStrucutre();

      return obj;
    },

    createEditModalFormDataStructure: function(month, day, year, description, title, id) {
      const obj = {};

      obj["days"] = this.createDaysDataStructure(day);
      obj["years"] = this.createYearsDataStructure(year);
      obj["months"] = this.createMonthsDataStrucutre(month);
      obj["description"] = description;
      obj["title"] = title;
      obj["id"] = id;
      return obj;
    },

  }

  App.init();
})();

