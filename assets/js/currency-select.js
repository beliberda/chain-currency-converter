(function () {
  "use strict";

  // Searchable currency picker: an input you can type into to filter by
  // code, official name, or country (e.g. "вьетнам" -> VND), backed by a
  // dropdown list. Replaces a plain <select> wherever currencies are chosen.
  function create(container, options) {
    options = options || {};
    var currencies = options.currencies || [];
    var value = options.value || currencies[0] || "";
    var onChange = options.onChange || function () {};

    container.classList.add("ccy-select");
    container.innerHTML = '<input class="ccy-select__input" type="text" autocomplete="off" spellcheck="false" />';

    var $input = container.querySelector(".ccy-select__input");
    var $menu = document.createElement("div");
    $menu.className = "ccy-select__menu";
    $menu.hidden = true;
    document.body.appendChild($menu);

    function positionMenu() {
      var rect = $input.getBoundingClientRect();
      var width = Math.max(rect.width, 220);
      var left = Math.min(rect.left, window.innerWidth - width - 8);
      $menu.style.left = Math.max(8, left) + "px";
      $menu.style.top = rect.bottom + 4 + "px";
      $menu.style.width = width + "px";
    }
    var filtered = currencies.slice();
    var activeIndex = -1;
    var open = false;

    function label(code) {
      return window.CurrencyData ? window.CurrencyData.getLabel(code) : code;
    }

    function showValue() {
      $input.value = value ? label(value) : "";
    }

    function closeMenu() {
      open = false;
      $menu.hidden = true;
      $menu.innerHTML = "";
      activeIndex = -1;
    }

    function renderMenu() {
      $menu.innerHTML = "";
      if (!filtered.length) {
        var empty = document.createElement("div");
        empty.className = "ccy-select__empty";
        empty.textContent = "Ничего не найдено";
        $menu.appendChild(empty);
        return;
      }
      filtered.forEach(function (code, i) {
        var item = document.createElement("div");
        item.className = "ccy-select__option" + (i === activeIndex ? " is-active" : "");
        item.dataset.code = code;

        var codeEl = document.createElement("span");
        codeEl.className = "ccy-select__option-code";
        codeEl.textContent = code;
        item.appendChild(codeEl);

        var info = window.CurrencyData ? window.CurrencyData.getInfo(code) : null;
        if (info) {
          var nameEl = document.createElement("span");
          nameEl.className = "ccy-select__option-name";
          nameEl.textContent = info.name + " · " + info.country;
          item.appendChild(nameEl);
        }

        item.addEventListener("mousedown", function (e) {
          // mousedown (not click) so it fires before the input's blur handler
          e.preventDefault();
          select(code);
        });

        $menu.appendChild(item);
      });
    }

    function openMenu() {
      open = true;
      $menu.hidden = false;
      positionMenu();
      filter("");
    }

    function filter(query) {
      filtered = currencies.filter(function (code) {
        return window.CurrencyData ? window.CurrencyData.matches(code, query) : true;
      });
      activeIndex = filtered.length ? 0 : -1;
      renderMenu();
    }

    function select(code) {
      value = code;
      showValue();
      closeMenu();
      onChange(code);
    }

    $input.addEventListener("focus", function () {
      $input.select();
      openMenu();
    });

    $input.addEventListener("input", function () {
      filter($input.value);
      if (!open) openMenu();
    });

    $input.addEventListener("blur", function () {
      showValue();
      closeMenu();
    });

    $input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        showValue();
        closeMenu();
        $input.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) openMenu();
        if (filtered.length) {
          activeIndex = (activeIndex + 1) % filtered.length;
          renderMenu();
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtered.length) {
          activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
          renderMenu();
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          select(filtered[activeIndex]);
          $input.blur();
        }
      }
    });

    function onWindowChange() {
      if (open) positionMenu();
    }
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    showValue();

    return {
      getValue: function () {
        return value;
      },
      setValue: function (code) {
        value = code;
        showValue();
      },
      setCurrencies: function (list) {
        currencies = list.slice();
      },
      destroy: function () {
        window.removeEventListener("resize", onWindowChange);
        window.removeEventListener("scroll", onWindowChange, true);
        $menu.parentNode && $menu.parentNode.removeChild($menu);
      },
    };
  }

  window.CurrencySelect = { create: create };
})();
