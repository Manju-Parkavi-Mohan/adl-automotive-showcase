// ISO 3166-1 alpha-2 country list with flag emojis. Used by CountrySelect.

export interface Country {
  code: string; // ISO 2
  name: string;
  flag: string;
}

function flag(cc: string): string {
  return cc
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

const RAW: Array<[string, string]> = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"],
  ["AO", "Angola"], ["AG", "Antigua and Barbuda"], ["AR", "Argentina"], ["AM", "Armenia"],
  ["AU", "Australia"], ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"],
  ["BH", "Bahrain"], ["BD", "Bangladesh"], ["BB", "Barbados"], ["BY", "Belarus"],
  ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"], ["BT", "Bhutan"],
  ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"], ["BW", "Botswana"], ["BR", "Brazil"],
  ["BN", "Brunei"], ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"],
  ["KH", "Cambodia"], ["CM", "Cameroon"], ["CA", "Canada"], ["CV", "Cape Verde"],
  ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"],
  ["CO", "Colombia"], ["KM", "Comoros"], ["CG", "Congo"], ["CD", "Congo (DRC)"],
  ["CR", "Costa Rica"], ["CI", "Côte d'Ivoire"], ["HR", "Croatia"], ["CU", "Cuba"],
  ["CY", "Cyprus"], ["CZ", "Czechia"], ["DK", "Denmark"], ["DJ", "Djibouti"],
  ["DM", "Dominica"], ["DO", "Dominican Republic"], ["EC", "Ecuador"], ["EG", "Egypt"],
  ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"], ["ER", "Eritrea"], ["EE", "Estonia"],
  ["SZ", "Eswatini"], ["ET", "Ethiopia"], ["FJ", "Fiji"], ["FI", "Finland"],
  ["FR", "France"], ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"],
  ["DE", "Germany"], ["GH", "Ghana"], ["GR", "Greece"], ["GD", "Grenada"],
  ["GT", "Guatemala"], ["GN", "Guinea"], ["GW", "Guinea-Bissau"], ["GY", "Guyana"],
  ["HT", "Haiti"], ["HN", "Honduras"], ["HK", "Hong Kong"], ["HU", "Hungary"],
  ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"], ["IR", "Iran"],
  ["IQ", "Iraq"], ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"],
  ["JM", "Jamaica"], ["JP", "Japan"], ["JO", "Jordan"], ["KZ", "Kazakhstan"],
  ["KE", "Kenya"], ["KI", "Kiribati"], ["KW", "Kuwait"], ["KG", "Kyrgyzstan"],
  ["LA", "Laos"], ["LV", "Latvia"], ["LB", "Lebanon"], ["LS", "Lesotho"],
  ["LR", "Liberia"], ["LY", "Libya"], ["LI", "Liechtenstein"], ["LT", "Lithuania"],
  ["LU", "Luxembourg"], ["MO", "Macao"], ["MG", "Madagascar"], ["MW", "Malawi"],
  ["MY", "Malaysia"], ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"],
  ["MH", "Marshall Islands"], ["MR", "Mauritania"], ["MU", "Mauritius"], ["MX", "Mexico"],
  ["FM", "Micronesia"], ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"],
  ["ME", "Montenegro"], ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"],
  ["NA", "Namibia"], ["NR", "Nauru"], ["NP", "Nepal"], ["NL", "Netherlands"],
  ["NZ", "New Zealand"], ["NI", "Nicaragua"], ["NE", "Niger"], ["NG", "Nigeria"],
  ["KP", "North Korea"], ["MK", "North Macedonia"], ["NO", "Norway"], ["OM", "Oman"],
  ["PK", "Pakistan"], ["PW", "Palau"], ["PS", "Palestine"], ["PA", "Panama"],
  ["PG", "Papua New Guinea"], ["PY", "Paraguay"], ["PE", "Peru"], ["PH", "Philippines"],
  ["PL", "Poland"], ["PT", "Portugal"], ["QA", "Qatar"], ["RO", "Romania"],
  ["RU", "Russia"], ["RW", "Rwanda"], ["KN", "Saint Kitts and Nevis"], ["LC", "Saint Lucia"],
  ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"], ["SM", "San Marino"],
  ["ST", "São Tomé and Príncipe"], ["SA", "Saudi Arabia"], ["SN", "Senegal"], ["RS", "Serbia"],
  ["SC", "Seychelles"], ["SL", "Sierra Leone"], ["SG", "Singapore"], ["SK", "Slovakia"],
  ["SI", "Slovenia"], ["SB", "Solomon Islands"], ["SO", "Somalia"], ["ZA", "South Africa"],
  ["KR", "South Korea"], ["SS", "South Sudan"], ["ES", "Spain"], ["LK", "Sri Lanka"],
  ["SD", "Sudan"], ["SR", "Suriname"], ["SE", "Sweden"], ["CH", "Switzerland"],
  ["SY", "Syria"], ["TW", "Taiwan"], ["TJ", "Tajikistan"], ["TZ", "Tanzania"],
  ["TH", "Thailand"], ["TL", "Timor-Leste"], ["TG", "Togo"], ["TO", "Tonga"],
  ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"], ["TR", "Türkiye"], ["TM", "Turkmenistan"],
  ["TV", "Tuvalu"], ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"],
  ["VU", "Vanuatu"], ["VA", "Vatican City"], ["VE", "Venezuela"], ["VN", "Vietnam"],
  ["YE", "Yemen"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
];

export const COUNTRIES: Country[] = RAW.map(([code, name]) => ({
  code,
  name,
  flag: flag(code),
}));

const MIDDLE_EAST = ["AE", "SA", "QA", "KW", "OM", "BH", "JO", "LB", "IQ"];
const AFRICA_PRIORITY = ["EG", "ZA", "MA", "NG", "KE", "DZ", "TN", "GH", "ET"];

export function getOrderedCountries(): Country[] {
  const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
  const pick = (codes: string[]): Country[] =>
    codes.map((c) => byCode.get(c)).filter((c): c is Country => Boolean(c));

  const me = pick(MIDDLE_EAST);
  const af = pick(AFRICA_PRIORITY);
  const usedCodes = new Set([...MIDDLE_EAST, ...AFRICA_PRIORITY]);
  const rest = COUNTRIES
    .filter((c) => !usedCodes.has(c.code))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...me, ...af, ...rest];
}

export function findCountry(code: string | undefined | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}