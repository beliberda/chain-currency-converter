(function () {
  "use strict";

  // Russian name + country/region for each ISO 4217 currency code, used for
  // display and for the searchable currency pickers (search by code, official
  // name, or country name — e.g. typing "вьетнам" should surface VND).
  var CURRENCY_INFO = {
    USD: { name: "Доллар США", country: "США" },
    EUR: { name: "Евро", country: "Евросоюз" },
    RUB: { name: "Российский рубль", country: "Россия" },
    GBP: { name: "Фунт стерлингов", country: "Великобритания" },
    JPY: { name: "Японская иена", country: "Япония" },
    CNY: { name: "Китайский юань", country: "Китай" },
    CHF: { name: "Швейцарский франк", country: "Швейцария" },
    CAD: { name: "Канадский доллар", country: "Канада" },
    AUD: { name: "Австралийский доллар", country: "Австралия" },
    NZD: { name: "Новозеландский доллар", country: "Новая Зеландия" },
    HKD: { name: "Гонконгский доллар", country: "Гонконг" },
    SGD: { name: "Сингапурский доллар", country: "Сингапур" },
    SEK: { name: "Шведская крона", country: "Швеция" },
    NOK: { name: "Норвежская крона", country: "Норвегия" },
    DKK: { name: "Датская крона", country: "Дания" },
    PLN: { name: "Польский злотый", country: "Польша" },
    CZK: { name: "Чешская крона", country: "Чехия" },
    HUF: { name: "Венгерский форинт", country: "Венгрия" },
    RON: { name: "Румынский лей", country: "Румыния" },
    BGN: { name: "Болгарский лев", country: "Болгария" },
    HRK: { name: "Хорватская куна", country: "Хорватия" },
    TRY: { name: "Турецкая лира", country: "Турция" },
    UAH: { name: "Украинская гривна", country: "Украина" },
    BYN: { name: "Белорусский рубль", country: "Беларусь" },
    KZT: { name: "Казахстанский тенге", country: "Казахстан" },
    UZS: { name: "Узбекский сум", country: "Узбекистан" },
    AZN: { name: "Азербайджанский манат", country: "Азербайджан" },
    AMD: { name: "Армянский драм", country: "Армения" },
    GEL: { name: "Грузинский лари", country: "Грузия" },
    KGS: { name: "Киргизский сом", country: "Киргизия" },
    TJS: { name: "Таджикский сомони", country: "Таджикистан" },
    TMT: { name: "Туркменский манат", country: "Туркменистан" },
    MDL: { name: "Молдавский лей", country: "Молдова" },
    RSD: { name: "Сербский динар", country: "Сербия" },
    ALL: { name: "Албанский лек", country: "Албания" },
    BAM: { name: "Конвертируемая марка", country: "Босния и Герцеговина" },
    MKD: { name: "Македонский денар", country: "Северная Македония" },
    ISK: { name: "Исландская крона", country: "Исландия" },
    INR: { name: "Индийская рупия", country: "Индия" },
    PKR: { name: "Пакистанская рупия", country: "Пакистан" },
    BDT: { name: "Бангладешская така", country: "Бангладеш" },
    LKR: { name: "Шри-ланкийская рупия", country: "Шри-Ланка" },
    NPR: { name: "Непальская рупия", country: "Непал" },
    MMK: { name: "Мьянманский кьят", country: "Мьянма" },
    THB: { name: "Тайский бат", country: "Таиланд" },
    VND: { name: "Вьетнамский донг", country: "Вьетнам" },
    IDR: { name: "Индонезийская рупия", country: "Индонезия" },
    MYR: { name: "Малайзийский ринггит", country: "Малайзия" },
    PHP: { name: "Филиппинское песо", country: "Филиппины" },
    KHR: { name: "Камбоджийский риель", country: "Камбоджа" },
    LAK: { name: "Лаосский кип", country: "Лаос" },
    BND: { name: "Брунейский доллар", country: "Бруней" },
    MOP: { name: "Патака Макао", country: "Макао" },
    TWD: { name: "Новый тайваньский доллар", country: "Тайвань" },
    KRW: { name: "Южнокорейская вона", country: "Южная Корея" },
    KPW: { name: "Северокорейская вона", country: "Северная Корея" },
    MNT: { name: "Монгольский тугрик", country: "Монголия" },
    AFN: { name: "Афганский афгани", country: "Афганистан" },
    IRR: { name: "Иранский риал", country: "Иран" },
    IQD: { name: "Иракский динар", country: "Ирак" },
    SYP: { name: "Сирийский фунт", country: "Сирия" },
    LBP: { name: "Ливанский фунт", country: "Ливан" },
    JOD: { name: "Иорданский динар", country: "Иордания" },
    ILS: { name: "Новый израильский шекель", country: "Израиль" },
    SAR: { name: "Саудовский риял", country: "Саудовская Аравия" },
    AED: { name: "Дирхам ОАЭ", country: "ОАЭ" },
    QAR: { name: "Катарский риал", country: "Катар" },
    KWD: { name: "Кувейтский динар", country: "Кувейт" },
    BHD: { name: "Бахрейнский динар", country: "Бахрейн" },
    OMR: { name: "Оманский риал", country: "Оман" },
    YER: { name: "Йеменский риал", country: "Йемен" },
    EGP: { name: "Египетский фунт", country: "Египет" },
    LYD: { name: "Ливийский динар", country: "Либия" },
    TND: { name: "Тунисский динар", country: "Тунис" },
    DZD: { name: "Алжирский динар", country: "Алжир" },
    MAD: { name: "Марокканский дирхам", country: "Марокко" },
    SDG: { name: "Суданский фунт", country: "Судан" },
    ETB: { name: "Эфиопский бирр", country: "Эфиопия" },
    KES: { name: "Кенийский шиллинг", country: "Кения" },
    TZS: { name: "Танзанийский шиллинг", country: "Танзания" },
    UGX: { name: "Угандийский шиллинг", country: "Уганда" },
    RWF: { name: "Руандийский франк", country: "Руанда" },
    BIF: { name: "Бурундийский франк", country: "Бурунди" },
    DJF: { name: "Джибутийский франк", country: "Джибути" },
    SOS: { name: "Сомалийский шиллинг", country: "Сомали" },
    ERN: { name: "Эритрейская накфа", country: "Эритрея" },
    NGN: { name: "Нигерийская найра", country: "Нигерия" },
    GHS: { name: "Ганский седи", country: "Гана" },
    XOF: { name: "Франк КФА BCEAO", country: "Западная Африка" },
    XAF: { name: "Франк КФА BEAC", country: "Центральная Африка" },
    CVE: { name: "Эскудо Кабо-Верде", country: "Кабо-Верде" },
    GMD: { name: "Гамбийский даласи", country: "Гамбия" },
    GNF: { name: "Гвинейский франк", country: "Гвинея" },
    SLL: { name: "Сьерра-леонский леоне", country: "Сьерра-Леоне" },
    SLE: { name: "Сьерра-леонский леоне", country: "Сьерра-Леоне" },
    LRD: { name: "Либерийский доллар", country: "Либерия" },
    CDF: { name: "Конголезский франк", country: "ДР Конго" },
    AOA: { name: "Ангольская кванза", country: "Ангола" },
    ZMW: { name: "Замбийская квача", country: "Замбия" },
    MWK: { name: "Малавийская квача", country: "Малави" },
    MZN: { name: "Мозамбикский метикал", country: "Мозамбик" },
    ZAR: { name: "Южноафриканский рэнд", country: "ЮАР" },
    NAD: { name: "Намибийский доллар", country: "Намибия" },
    BWP: { name: "Ботсванская пула", country: "Ботсвана" },
    LSL: { name: "Лесотский лоти", country: "Лесото" },
    SZL: { name: "Свазилендский лилангени", country: "Эсватини" },
    MUR: { name: "Маврикийская рупия", country: "Маврикий" },
    SCR: { name: "Сейшельская рупия", country: "Сейшелы" },
    MGA: { name: "Малагасийский ариари", country: "Мадагаскар" },
    KMF: { name: "Коморский франк", country: "Коморы" },
    STN: { name: "Добра", country: "Сан-Томе и Принсипи" },
    BRL: { name: "Бразильский реал", country: "Бразилия" },
    ARS: { name: "Аргентинское песо", country: "Аргентина" },
    CLP: { name: "Чилийское песо", country: "Чили" },
    COP: { name: "Колумбийское песо", country: "Колумбия" },
    PEN: { name: "Перуанский соль", country: "Перу" },
    BOB: { name: "Боливийский боливиано", country: "Боливия" },
    PYG: { name: "Парагвайский гуарани", country: "Парагвай" },
    UYU: { name: "Уругвайское песо", country: "Уругвай" },
    VES: { name: "Венесуэльский боливар", country: "Венесуэла" },
    GYD: { name: "Гайанский доллар", country: "Гайана" },
    SRD: { name: "Суринамский доллар", country: "Суринам" },
    MXN: { name: "Мексиканское песо", country: "Мексика" },
    GTQ: { name: "Гватемальский кетсаль", country: "Гватемала" },
    HNL: { name: "Гондурасская лемпира", country: "Гондурас" },
    NIO: { name: "Никарагуанская кордоба", country: "Никарагуа" },
    CRC: { name: "Костариканский колон", country: "Костa-Рика" },
    PAB: { name: "Панамское бальбоа", country: "Панама" },
    DOP: { name: "Доминиканское песо", country: "Доминиканская Республика" },
    CUP: { name: "Кубинское песо", country: "Куба" },
    JMD: { name: "Ямайский доллар", country: "Ямайка" },
    TTD: { name: "Доллар Тринидада и Тобаго", country: "Тринидад и Тобаго" },
    BBD: { name: "Барбадосский доллар", country: "Барбадос" },
    BSD: { name: "Багамский доллар", country: "Багамы" },
    BZD: { name: "Белизский доллар", country: "Белиз" },
    HTG: { name: "Гаитянский гурд", country: "Гаити" },
    XCD: { name: "Восточно-карибский доллар", country: "Восточные Карибы" },
    AWG: { name: "Арубанский флорин", country: "Аруба" },
    ANG: { name: "Нидерландский антильский гульден", country: "Кюрасао и Синт-Мартен" },
    KYD: { name: "Доллар Островов Кайман", country: "Острова Кайман" },
    BMD: { name: "Бермудский доллар", country: "Бермуды" },
    FJD: { name: "Фиджийский доллар", country: "Фиджи" },
    PGK: { name: "Папуасская кина", country: "Папуа — Новая Гвинея" },
    WST: { name: "Самоанская тала", country: "Самоа" },
    TOP: { name: "Тонганская паанга", country: "Тонга" },
    VUV: { name: "Вануатский вату", country: "Вануату" },
    SBD: { name: "Доллар Соломоновых Островов", country: "Соломоновы Острова" },
    XPF: { name: "Французский тихоокеанский франк", country: "Французская Полинезия" },
    CUC: { name: "Кубинское конвертируемое песо", country: "Куба" },
    SVC: { name: "Сальвадорский колон", country: "Сальвадор" },
    XDR: { name: "Специальные права заимствования", country: "МВФ" },
  };

  var ALIASES = {
    RUB: ["россия", "рф"],
    USD: ["америка", "штаты"],
    GBP: ["англия", "великая британия", "соединенное королевство"],
    KRW: ["корея южная"],
    KPW: ["корея северная"],
    AED: ["эмираты", "дубай"],
    CZK: ["чехия"],
    STN: ["сан томе"],
  };

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .trim();
  }

  function getInfo(code) {
    return CURRENCY_INFO[code] || null;
  }

  function getLabel(code) {
    var info = getInfo(code);
    return info ? code + " — " + info.name : code;
  }

  function searchIndex(code) {
    var info = getInfo(code);
    var parts = [code];
    if (info) {
      parts.push(info.name, info.country);
    }
    if (ALIASES[code]) {
      parts = parts.concat(ALIASES[code]);
    }
    return normalize(parts.join(" | "));
  }

  function matches(code, query) {
    var q = normalize(query);
    if (!q) return true;
    return searchIndex(code).indexOf(q) !== -1;
  }

  window.CurrencyData = {
    getInfo: getInfo,
    getLabel: getLabel,
    matches: matches,
    normalize: normalize,
  };
})();
