(function () {
  "use strict";

  var API_URL = "https://open.er-api.com/v6/latest/USD";
  var STORAGE_KEY = "currency-converter:settings:v1";

  /** @type {Record<string, number>} 1 USD = rates[code] CODE */
  var rates = {};
  var currencies = [];
  var loaded = false;

  var mainRateOverride = null; // number|null, manual override for the quick converter

  /**
   * Each chain: { id, currencies: [code,...], rates: [rate,...], overridden: [bool,...] }
   * rates[i] / overridden[i] describe the step currencies[i] -> currencies[i+1].
   */
  var chains = [];
  var chainIdCounter = 0;
  var chainSelectInstances = []; // CurrencySelect instances from the last renderChains(), destroyed on re-render

  // ---- DOM ----
  var $status = document.getElementById("status");
  var $amount = document.getElementById("amount");
  var $fromContainer = document.getElementById("fromCurrency");
  var $toContainer = document.getElementById("toCurrency");
  var $from = null; // CurrencySelect instance, created once currencies are known
  var $to = null; // CurrencySelect instance, created once currencies are known
  var $swap = document.getElementById("swapBtn");
  var $resultValue = document.getElementById("resultValue");
  var $mainRate = document.getElementById("mainRate");
  var $mainRateLabel = document.getElementById("mainRateLabel");
  var $resetMainRate = document.getElementById("resetMainRate");
  var $chains = document.getElementById("chains");
  var $addChainBtn = document.getElementById("addChainBtn");
  var $compare = document.getElementById("compare");

  // ---- helpers ----
  function fmt(n) {
    if (!isFinite(n)) return "—";
    var abs = Math.abs(n);
    var digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
    return n.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  function directRate(from, to) {
    if (!loaded || !rates[from] || !rates[to]) return NaN;
    return rates[to] / rates[from];
  }

  // ---- quick converter ----
  // The rate is always quoted as "how much does 1 unit of the destination
  // currency cost in the source currency" (e.g. RUB -> USD shows "1 USD = 86
  // RUB"), since that's how people actually think about an exchange rate.
  function currentQuote() {
    if (mainRateOverride !== null) return mainRateOverride;
    return directRate($to.getValue(), $from.getValue());
  }

  function renderMain() {
    var quote = currentQuote();
    $mainRate.value = isFinite(quote) ? round(quote, 8) : "";
    $mainRateLabel.textContent = "1 " + $to.getValue() + " = ? " + $from.getValue() + " (можно исправить)";

    var rate = isFinite(quote) && quote > 0 ? 1 / quote : NaN;
    var amount = parseLocaleNumber($amount.value) || 0;
    var result = amount * rate;
    $resultValue.textContent = isFinite(result)
      ? fmt(result) + " " + $to.getValue()
      : "—";
    saveSettings();
  }

  function parseLocaleNumber(str) {
    if (typeof str !== "string") return NaN;
    var normalized = str.trim().replace(",", ".").replace(/\s+/g, "");
    if (normalized === "") return NaN;
    return parseFloat(normalized);
  }

  function round(n, digits) {
    var p = Math.pow(10, digits);
    return Math.round(n * p) / p;
  }

  // ---- persisted settings ----
  function saveSettings() {
    try {
      var data = {
        amount: $amount.value,
        from: $from.getValue(),
        to: $to.getValue(),
        mainRateOverride: mainRateOverride,
        chains: chains.map(function (chain) {
          return {
            currencies: chain.currencies,
            steps: chain.steps.map(function (step) {
              return step.overridden
                ? { overridden: true, direction: step.direction, quoteAmount: step.quoteAmount, toPerFrom: step.toPerFrom }
                : null;
            }),
          };
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage can be unavailable (private mode, quota) — settings just won't persist.
    }
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function onFromToChanged() {
    mainRateOverride = null;
    renderMain();
  }

  $amount.addEventListener("input", function () {
    renderMain();
    renderCompare();
  });

  $swap.addEventListener("click", function () {
    var a = $from.getValue();
    $from.setValue($to.getValue());
    $to.setValue(a);
    onFromToChanged();
  });

  $mainRate.addEventListener("input", function () {
    var v = parseLocaleNumber($mainRate.value);
    mainRateOverride = isFinite(v) && v > 0 ? v : mainRateOverride;
    renderMain();
  });

  $resetMainRate.addEventListener("click", function () {
    mainRateOverride = null;
    renderMain();
  });

  // ---- chains ----
  // Each step is quoted the way people naturally think about it: whichever
  // direction gives a number >= 1 (e.g. "1 USD = 86 RUB" rather than
  // "1 RUB = 0.0116 USD"). `toPerFrom` is always used for the actual math.
  function makeStep(from, to) {
    var toPerFrom = directRate(from, to);
    var direction = toPerFrom >= 1 ? "forward" : "inverse";
    var quoteAmount = direction === "forward" ? toPerFrom : 1 / toPerFrom;
    return { toPerFrom: toPerFrom, direction: direction, quoteAmount: quoteAmount, overridden: false };
  }

  function makeChain(currencyCodes) {
    var codes = currencyCodes.slice();
    var chain = { id: "chain" + chainIdCounter++, currencies: codes, steps: [] };
    recomputeLiveRates(chain);
    return chain;
  }

  function recomputeLiveRates(chain) {
    chain.steps = [];
    for (var i = 0; i < chain.currencies.length - 1; i++) {
      chain.steps.push(makeStep(chain.currencies[i], chain.currencies[i + 1]));
    }
  }

  function pickDefaultInsertCurrency(chain) {
    for (var i = 0; i < currencies.length; i++) {
      if (chain.currencies.indexOf(currencies[i]) === -1) return currencies[i];
    }
    return chain.currencies[0];
  }

  function chainResult(chain, amount) {
    var value = amount;
    chain.steps.forEach(function (step) {
      value *= isFinite(step.toPerFrom) ? step.toPerFrom : NaN;
    });
    return value;
  }

  function renderChains() {
    chainSelectInstances.forEach(function (instance) {
      instance.destroy();
    });
    chainSelectInstances = [];
    $chains.innerHTML = "";
    chains.forEach(function (chain) {
      var row = document.createElement("div");
      row.className = "chain-row";

      if (chains.length > 1) {
        var removeChain = document.createElement("button");
        removeChain.className = "chain-row__remove";
        removeChain.textContent = "✕";
        removeChain.title = "Удалить цепочку";
        removeChain.addEventListener("click", function () {
          chains = chains.filter(function (c) {
            return c.id !== chain.id;
          });
          renderChains();
          renderCompare();
        });
        row.appendChild(removeChain);
      }

      chain.currencies.forEach(function (code, i) {
        var block = document.createElement("div");
        block.className = "chain-block";

        var rateWrap = document.createElement("div");
        rateWrap.className = "chain-block__rate";
        if (i < chain.currencies.length - 1) {
          var step = chain.steps[i];
          var next = chain.currencies[i + 1];
          var forward = step.direction === "forward";

          var leftLabel = document.createElement("span");
          leftLabel.className = "chain-block__rate-label";
          leftLabel.textContent = forward ? "1 " + code + " =" : "";
          rateWrap.appendChild(leftLabel);

          var input = document.createElement("input");
          input.type = "text";
          input.inputMode = "decimal";
          input.title = forward
            ? "1 " + code + " = ? " + next
            : "? " + code + " = 1 " + next;
          input.value = isFinite(step.quoteAmount) ? round(step.quoteAmount, 8) : "";
          input.addEventListener("input", function () {
            var v = parseLocaleNumber(input.value);
            if (isFinite(v) && v > 0) {
              step.quoteAmount = v;
              step.toPerFrom = forward ? v : 1 / v;
              step.overridden = true;
              renderCompare();
            }
          });
          rateWrap.appendChild(input);

          var rightLabel = document.createElement("span");
          rightLabel.className = "chain-block__rate-label";
          rightLabel.textContent = forward ? next : "= 1 " + next;
          rateWrap.appendChild(rightLabel);
        }
        block.appendChild(rateWrap);

        var selectWrap = document.createElement("div");
        selectWrap.className = "chain-block__currency";
        block.appendChild(selectWrap);
        chainSelectInstances.push(CurrencySelect.create(selectWrap, {
          currencies: currencies,
          value: code,
          onChange: function (newCode) {
            chain.currencies[i] = newCode;
            recomputeLiveRates(chain);
            renderChains();
            renderCompare();
          },
        }));

        if (chain.currencies.length > 2) {
          var removeBlock = document.createElement("button");
          removeBlock.className = "chain-block__remove";
          removeBlock.textContent = "✕";
          removeBlock.title = "Убрать " + code + " из цепочки";
          removeBlock.addEventListener("click", function () {
            chain.currencies.splice(i, 1);
            recomputeLiveRates(chain);
            renderChains();
            renderCompare();
          });
          block.appendChild(removeBlock);
        }

        row.appendChild(block);

        if (i < chain.currencies.length - 1) {
          var connector = document.createElement("div");
          connector.className = "chain-connector";

          var arrow = document.createElement("span");
          arrow.className = "chain-connector__arrow";
          arrow.textContent = "→";
          connector.appendChild(arrow);

          var plus = document.createElement("button");
          plus.className = "chain-connector__plus";
          plus.textContent = "+";
          plus.title = "Вставить валюту здесь";
          plus.addEventListener("click", function () {
            chain.currencies.splice(i + 1, 0, pickDefaultInsertCurrency(chain));
            recomputeLiveRates(chain);
            renderChains();
            renderCompare();
          });
          connector.appendChild(plus);

          row.appendChild(connector);
        }
      });

      $chains.appendChild(row);
    });
  }

  $addChainBtn.addEventListener("click", function () {
    var base = chains.length ? chains[chains.length - 1].currencies : [$from.getValue(), $to.getValue()];
    chains.push(makeChain(base));
    renderChains();
    renderCompare();
  });

  // ---- comparison ----
  function renderCompare() {
    $compare.innerHTML = "";
    if (!chains.length) return;

    var amount = parseLocaleNumber($amount.value) || 0;
    var rows = chains.map(function (chain) {
      var to = chain.currencies[chain.currencies.length - 1];
      return {
        chain: chain,
        value: chainResult(chain, amount),
        unit: to,
        label: chain.currencies.join(" → "),
      };
    });

    var showBest = rows.length > 1;
    var best = rows.reduce(function (a, b) {
      if (!isFinite(a.value)) return b;
      if (!isFinite(b.value)) return a;
      return b.value > a.value ? b : a;
    }, rows[0]);

    rows.forEach(function (row) {
      var el = document.createElement("div");
      el.className = "compare-row" + (showBest && row.chain === best.chain ? " best" : "");

      var label = document.createElement("div");
      label.className = "compare-row__label";
      label.textContent = row.label;
      el.appendChild(label);

      var value = document.createElement("div");
      value.className = "compare-row__value";
      value.textContent = isFinite(row.value) ? fmt(row.value) + " " + row.unit : "—";
      el.appendChild(value);

      $compare.appendChild(el);
    });

    saveSettings();
  }

  // ---- init ----
  function init(data) {
    rates = data.rates;
    rates[data.base_code || "USD"] = 1;
    currencies = Object.keys(rates).sort();
    loaded = true;

    var saved = loadSettings();

    var defaultFrom = currencies.indexOf("RUB") !== -1 ? "RUB" : currencies[0];
    var defaultTo = currencies.indexOf("USD") !== -1 ? "USD" : currencies[1];
    if (saved && currencies.indexOf(saved.from) !== -1) defaultFrom = saved.from;
    if (saved && currencies.indexOf(saved.to) !== -1) defaultTo = saved.to;

    $from = CurrencySelect.create($fromContainer, {
      currencies: currencies,
      value: defaultFrom,
      onChange: onFromToChanged,
    });
    $to = CurrencySelect.create($toContainer, {
      currencies: currencies,
      value: defaultTo,
      onChange: onFromToChanged,
    });

    if (saved && typeof saved.amount === "string" && saved.amount !== "") {
      $amount.value = saved.amount;
    }
    if (saved && isFinite(saved.mainRateOverride) && saved.mainRateOverride > 0) {
      mainRateOverride = saved.mainRateOverride;
    }

    var defaultThird = currencies.indexOf("VND") !== -1 ? "VND" : currencies[2] || defaultTo;
    chains = restoreChains(saved) || [makeChain([defaultFrom, defaultTo, defaultThird])];

    renderMain();
    renderChains();
    renderCompare();

    $status.textContent = "Курсы обновлены: " + (data.time_last_update_utc || "только что");
  }

  function restoreChains(saved) {
    if (!saved || !Array.isArray(saved.chains) || !saved.chains.length) return null;

    var restored = saved.chains
      .map(function (savedChain) {
        if (!Array.isArray(savedChain.currencies) || savedChain.currencies.length < 2) return null;
        var allKnown = savedChain.currencies.every(function (c) {
          return currencies.indexOf(c) !== -1;
        });
        if (!allKnown) return null;

        var chain = makeChain(savedChain.currencies);
        if (Array.isArray(savedChain.steps)) {
          savedChain.steps.forEach(function (savedStep, i) {
            if (savedStep && savedStep.overridden && chain.steps[i]) {
              chain.steps[i].direction = savedStep.direction;
              chain.steps[i].quoteAmount = savedStep.quoteAmount;
              chain.steps[i].toPerFrom = savedStep.toPerFrom;
              chain.steps[i].overridden = true;
            }
          });
        }
        return chain;
      })
      .filter(Boolean);

    return restored.length ? restored : null;
  }

  $status.textContent = "Загрузка курсов…";
  fetch(API_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      if (!data || !data.rates) throw new Error("Некорректный ответ API");
      init(data);
    })
    .catch(function (err) {
      $status.textContent = "Не удалось загрузить официальные курсы (" + err.message + "). Можно ввести курсы вручную.";
      $status.classList.add("error");
      // fall back to a minimal offline currency set so the UI stays usable
      init({
        base_code: "USD",
        rates: { USD: 1, EUR: 0.92, RUB: 90, VND: 25000, GBP: 0.78, CNY: 7.2 },
      });
    });
})();
