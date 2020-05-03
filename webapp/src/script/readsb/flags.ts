// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// flags.ts: Allocation of ICAO address range to country and flag file.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
namespace READSB {
    /**
     * Declare ICAO registration address ranges and country
     * install the flag images in flags-tiny subdirectory.
     */
    const icaoRanges: IIcaoRange[] = [
        // Mostly generated from the assignment table in the appendix to Chapter 9 of
        // Annex 10 Vol III, Second Edition, July 2007 (with amendments through 88-A, 14/11/2013)
        { Start: 0x700000, End: 0x700FFF, Country: "Afghanistan", FlagImage: "Afghanistan.png" },
        { Start: 0x501000, End: 0x5013FF, Country: "Albania", FlagImage: "Albania.png" },
        { Start: 0x0A0000, End: 0x0A7FFF, Country: "Algeria", FlagImage: "Algeria.png" },
        { Start: 0x090000, End: 0x090FFF, Country: "Angola", FlagImage: "Angola.png" },
        { Start: 0x0CA000, End: 0x0CA3FF, Country: "Antigua and Barbuda", FlagImage: "Antigua_and_Barbuda.png" },
        { Start: 0xE00000, End: 0xE3FFFF, Country: "Argentina", FlagImage: "Argentina.png" },
        { Start: 0x600000, End: 0x6003FF, Country: "Armenia", FlagImage: "Armenia.png" },
        { Start: 0x7C0000, End: 0x7FFFFF, Country: "Australia", FlagImage: "Australia.png" },
        { Start: 0x440000, End: 0x447FFF, Country: "Austria", FlagImage: "Austria.png" },
        { Start: 0x600800, End: 0x600BFF, Country: "Azerbaijan", FlagImage: "Azerbaijan.png" },
        { Start: 0x0A8000, End: 0x0A8FFF, Country: "Bahamas", FlagImage: "Bahamas.png" },
        { Start: 0x894000, End: 0x894FFF, Country: "Bahrain", FlagImage: "Bahrain.png" },
        { Start: 0x702000, End: 0x702FFF, Country: "Bangladesh", FlagImage: "Bangladesh.png" },
        { Start: 0x0AA000, End: 0x0AA3FF, Country: "Barbados", FlagImage: "Barbados.png" },
        { Start: 0x510000, End: 0x5103FF, Country: "Belarus", FlagImage: "Belarus.png" },
        { Start: 0x448000, End: 0x44FFFF, Country: "Belgium", FlagImage: "Belgium.png" },
        { Start: 0x0AB000, End: 0x0AB3FF, Country: "Belize", FlagImage: "Belize.png" },
        { Start: 0x094000, End: 0x0943FF, Country: "Benin", FlagImage: "Benin.png" },
        { Start: 0x680000, End: 0x6803FF, Country: "Bhutan", FlagImage: "Bhutan.png" },
        { Start: 0xE94000, End: 0xE94FFF, Country: "Bolivia", FlagImage: "Bolivia.png" },
        { Start: 0x513000, End: 0x5133FF, Country: "Bosnia and Herzegovina", FlagImage: "Bosnia.png" },
        { Start: 0x030000, End: 0x0303FF, Country: "Botswana", FlagImage: "Botswana.png" },
        { Start: 0xE40000, End: 0xE7FFFF, Country: "Brazil", FlagImage: "Brazil.png" },
        { Start: 0x895000, End: 0x8953FF, Country: "Brunei Darussalam", FlagImage: "Brunei.png" },
        { Start: 0x450000, End: 0x457FFF, Country: "Bulgaria", FlagImage: "Bulgaria.png" },
        { Start: 0x09C000, End: 0x09CFFF, Country: "Burkina Faso", FlagImage: "Burkina_Faso.png" },
        { Start: 0x032000, End: 0x032FFF, Country: "Burundi", FlagImage: "Burundi.png" },
        { Start: 0x70E000, End: 0x70EFFF, Country: "Cambodia", FlagImage: "Cambodia.png" },
        { Start: 0x034000, End: 0x034FFF, Country: "Cameroon", FlagImage: "Cameroon.png" },
        { Start: 0xC00000, End: 0xC3FFFF, Country: "Canada", FlagImage: "Canada.png" },
        { Start: 0x096000, End: 0x0963FF, Country: "Cape Verde", FlagImage: "Cape_Verde.png" },
        { Start: 0x06C000, End: 0x06CFFF, Country: "Central African Republic", FlagImage: "Central_African_Republic.png" },
        { Start: 0x084000, End: 0x084FFF, Country: "Chad", FlagImage: "Chad.png" },
        { Start: 0xE80000, End: 0xE80FFF, Country: "Chile", FlagImage: "Chile.png" },
        { Start: 0x780000, End: 0x7BFFFF, Country: "China", FlagImage: "China.png" },
        { Start: 0x899000, End: 0x8993FF, Country: "China", FlagImage: "China.png" },
        { Start: 0x0AC000, End: 0x0ACFFF, Country: "Colombia", FlagImage: "Colombia.png" },
        { Start: 0x035000, End: 0x0353FF, Country: "Comoros", FlagImage: "Comoros.png" },
        { Start: 0x036000, End: 0x036FFF, Country: "Congo", FlagImage: "Republic_of_the_Congo.png" }, // probably?
        { Start: 0x901000, End: 0x9013FF, Country: "Cook Islands", FlagImage: "Cook_Islands.png" },
        { Start: 0x0AE000, End: 0x0AEFFF, Country: "Costa Rica", FlagImage: "Costa_Rica.png" },
        { Start: 0x038000, End: 0x038FFF, Country: "Cote d'Ivoire", FlagImage: "Cote_d_Ivoire.png" },
        { Start: 0x501C00, End: 0x501FFF, Country: "Croatia", FlagImage: "Croatia.png" },
        { Start: 0x0B0000, End: 0x0B0FFF, Country: "Cuba", FlagImage: "Cuba.png" },
        { Start: 0x4C8000, End: 0x4C83FF, Country: "Cyprus", FlagImage: "Cyprus.png" },
        { Start: 0x498000, End: 0x49FFFF, Country: "Czech Republic", FlagImage: "Czech_Republic.png" },
        { Start: 0x720000, End: 0x727FFF, Country: "Democratic People's Republic of Korea", FlagImage: "North_Korea.png" },
        { Start: 0x08C000, End: 0x08CFFF, Country: "Democratic Republic of the Congo", FlagImage: "Democratic_Republic_of_the_Congo.png" },
        { Start: 0x458000, End: 0x45FFFF, Country: "Denmark", FlagImage: "Denmark.png" },
        { Start: 0x098000, End: 0x0983FF, Country: "Djibouti", FlagImage: "Djibouti.png" },
        { Start: 0x0C4000, End: 0x0C4FFF, Country: "Dominican Republic", FlagImage: "Dominican_Republic.png" },
        { Start: 0xE84000, End: 0xE84FFF, Country: "Ecuador", FlagImage: "Ecuador.png" },
        { Start: 0x010000, End: 0x017FFF, Country: "Egypt", FlagImage: "Egypt.png" },
        { Start: 0x0B2000, End: 0x0B2FFF, Country: "El Salvador", FlagImage: "El_Salvador.png" },
        { Start: 0x042000, End: 0x042FFF, Country: "Equatorial Guinea", FlagImage: "Equatorial_Guinea.png" },
        { Start: 0x202000, End: 0x2023FF, Country: "Eritrea", FlagImage: "Eritrea.png" },
        { Start: 0x511000, End: 0x5113FF, Country: "Estonia", FlagImage: "Estonia.png" },
        { Start: 0x040000, End: 0x040FFF, Country: "Ethiopia", FlagImage: "Ethiopia.png" },
        { Start: 0xC88000, End: 0xC88FFF, Country: "Fiji", FlagImage: "Fiji.png" },
        { Start: 0x460000, End: 0x467FFF, Country: "Finland", FlagImage: "Finland.png" },
        { Start: 0x380000, End: 0x3BFFFF, Country: "France", FlagImage: "France.png" },
        { Start: 0x03E000, End: 0x03EFFF, Country: "Gabon", FlagImage: "Gabon.png" },
        { Start: 0x09A000, End: 0x09AFFF, Country: "Gambia", FlagImage: "Gambia.png" },
        { Start: 0x514000, End: 0x5143FF, Country: "Georgia", FlagImage: "Georgia.png" },
        { Start: 0x3C0000, End: 0x3FFFFF, Country: "Germany", FlagImage: "Germany.png" },
        { Start: 0x044000, End: 0x044FFF, Country: "Ghana", FlagImage: "Ghana.png" },
        { Start: 0x468000, End: 0x46FFFF, Country: "Greece", FlagImage: "Greece.png" },
        { Start: 0x0CC000, End: 0x0CC3FF, Country: "Grenada", FlagImage: "Grenada.png" },
        { Start: 0x0B4000, End: 0x0B4FFF, Country: "Guatemala", FlagImage: "Guatemala.png" },
        { Start: 0x046000, End: 0x046FFF, Country: "Guinea", FlagImage: "Guinea.png" },
        { Start: 0x048000, End: 0x0483FF, Country: "Guinea-Bissau", FlagImage: "Guinea_Bissau.png" },
        { Start: 0x0B6000, End: 0x0B6FFF, Country: "Guyana", FlagImage: "Guyana.png" },
        { Start: 0x0B8000, End: 0x0B8FFF, Country: "Haiti", FlagImage: "Haiti.png" },
        { Start: 0x0BA000, End: 0x0BAFFF, Country: "Honduras", FlagImage: "Honduras.png" },
        { Start: 0x470000, End: 0x477FFF, Country: "Hungary", FlagImage: "Hungary.png" },
        { Start: 0x4CC000, End: 0x4CCFFF, Country: "Iceland", FlagImage: "Iceland.png" },
        { Start: 0x800000, End: 0x83FFFF, Country: "India", FlagImage: "India.png" },
        { Start: 0x8A0000, End: 0x8A7FFF, Country: "Indonesia", FlagImage: "Indonesia.png" },
        { Start: 0x730000, End: 0x737FFF, Country: "Iran, Islamic Republic of", FlagImage: "Iran.png" },
        { Start: 0x728000, End: 0x72FFFF, Country: "Iraq", FlagImage: "Iraq.png" },
        { Start: 0x4CA000, End: 0x4CAFFF, Country: "Ireland", FlagImage: "Ireland.png" },
        { Start: 0x738000, End: 0x73FFFF, Country: "Israel", FlagImage: "Israel.png" },
        { Start: 0x300000, End: 0x33FFFF, Country: "Italy", FlagImage: "Italy.png" },
        { Start: 0x0BE000, End: 0x0BEFFF, Country: "Jamaica", FlagImage: "Jamaica.png" },
        { Start: 0x840000, End: 0x87FFFF, Country: "Japan", FlagImage: "Japan.png" },
        { Start: 0x740000, End: 0x747FFF, Country: "Jordan", FlagImage: "Jordan.png" },
        { Start: 0x683000, End: 0x6833FF, Country: "Kazakhstan", FlagImage: "Kazakhstan.png" },
        { Start: 0x04C000, End: 0x04CFFF, Country: "Kenya", FlagImage: "Kenya.png" },
        { Start: 0xC8E000, End: 0xC8E3FF, Country: "Kiribati", FlagImage: "Kiribati.png" },
        { Start: 0x706000, End: 0x706FFF, Country: "Kuwait", FlagImage: "Kuwait.png" },
        { Start: 0x601000, End: 0x6013FF, Country: "Kyrgyzstan", FlagImage: "Kyrgyzstan.png" },
        { Start: 0x708000, End: 0x708FFF, Country: "Lao People's Democratic Republic", FlagImage: "Laos.png" },
        { Start: 0x502C00, End: 0x502FFF, Country: "Latvia", FlagImage: "Latvia.png" },
        { Start: 0x748000, End: 0x74FFFF, Country: "Lebanon", FlagImage: "Lebanon.png" },
        { Start: 0x04A000, End: 0x04A3FF, Country: "Lesotho", FlagImage: "Lesotho.png" },
        { Start: 0x050000, End: 0x050FFF, Country: "Liberia", FlagImage: "Liberia.png" },
        { Start: 0x018000, End: 0x01FFFF, Country: "Libyan Arab Jamahiriya", FlagImage: "Libya.png" },
        { Start: 0x503C00, End: 0x503FFF, Country: "Lithuania", FlagImage: "Lithuania.png" },
        { Start: 0x4D0000, End: 0x4D03FF, Country: "Luxembourg", FlagImage: "Luxembourg.png" },
        { Start: 0x054000, End: 0x054FFF, Country: "Madagascar", FlagImage: "Madagascar.png" },
        { Start: 0x058000, End: 0x058FFF, Country: "Malawi", FlagImage: "Malawi.png" },
        { Start: 0x750000, End: 0x757FFF, Country: "Malaysia", FlagImage: "Malaysia.png" },
        { Start: 0x05A000, End: 0x05A3FF, Country: "Maldives", FlagImage: "Maldives.png" },
        { Start: 0x05C000, End: 0x05CFFF, Country: "Mali", FlagImage: "Mali.png" },
        { Start: 0x4D2000, End: 0x4D23FF, Country: "Malta", FlagImage: "Malta.png" },
        { Start: 0x900000, End: 0x9003FF, Country: "Marshall Islands", FlagImage: "Marshall_Islands.png" },
        { Start: 0x05E000, End: 0x05E3FF, Country: "Mauritania", FlagImage: "Mauritania.png" },
        { Start: 0x060000, End: 0x0603FF, Country: "Mauritius", FlagImage: "Mauritius.png" },
        { Start: 0x0D0000, End: 0x0D7FFF, Country: "Mexico", FlagImage: "Mexico.png" },
        { Start: 0x681000, End: 0x6813FF, Country: "Micronesia, Federated States of", FlagImage: "Micronesia.png" },
        { Start: 0x4D4000, End: 0x4D43FF, Country: "Monaco", FlagImage: "Monaco.png" },
        { Start: 0x682000, End: 0x6823FF, Country: "Mongolia", FlagImage: "Mongolia.png" },
        { Start: 0x516000, End: 0x5163FF, Country: "Montenegro", FlagImage: "Montenegro.png" },
        { Start: 0x020000, End: 0x027FFF, Country: "Morocco", FlagImage: "Morocco.png" },
        { Start: 0x006000, End: 0x006FFF, Country: "Mozambique", FlagImage: "Mozambique.png" },
        { Start: 0x704000, End: 0x704FFF, Country: "Myanmar", FlagImage: "Myanmar.png" },
        { Start: 0x201000, End: 0x2013FF, Country: "Namibia", FlagImage: "Namibia.png" },
        { Start: 0xC8A000, End: 0xC8A3FF, Country: "Nauru", FlagImage: "Nauru.png" },
        { Start: 0x70A000, End: 0x70AFFF, Country: "Nepal", FlagImage: "Nepal.png" },
        { Start: 0x480000, End: 0x487FFF, Country: "Netherlands, Kingdom of the", FlagImage: "Netherlands.png" },
        { Start: 0xC80000, End: 0xC87FFF, Country: "New Zealand", FlagImage: "New_Zealand.png" },
        { Start: 0x0C0000, End: 0x0C0FFF, Country: "Nicaragua", FlagImage: "Nicaragua.png" },
        { Start: 0x062000, End: 0x062FFF, Country: "Niger", FlagImage: "Niger.png" },
        { Start: 0x064000, End: 0x064FFF, Country: "Nigeria", FlagImage: "Nigeria.png" },
        { Start: 0x478000, End: 0x47FFFF, Country: "Norway", FlagImage: "Norway.png" },
        { Start: 0x70C000, End: 0x70C3FF, Country: "Oman", FlagImage: "Oman.png" },
        { Start: 0x760000, End: 0x767FFF, Country: "Pakistan", FlagImage: "Pakistan.png" },
        { Start: 0x684000, End: 0x6843FF, Country: "Palau", FlagImage: "Palau.png" },
        { Start: 0x0C2000, End: 0x0C2FFF, Country: "Panama", FlagImage: "Panama.png" },
        { Start: 0x898000, End: 0x898FFF, Country: "Papua New Guinea", FlagImage: "Papua_New_Guinea.png" },
        { Start: 0xE88000, End: 0xE88FFF, Country: "Paraguay", FlagImage: "Paraguay.png" },
        { Start: 0xE8C000, End: 0xE8CFFF, Country: "Peru", FlagImage: "Peru.png" },
        { Start: 0x758000, End: 0x75FFFF, Country: "Philippines", FlagImage: "Philippines.png" },
        { Start: 0x488000, End: 0x48FFFF, Country: "Poland", FlagImage: "Poland.png" },
        { Start: 0x490000, End: 0x497FFF, Country: "Portugal", FlagImage: "Portugal.png" },
        { Start: 0x06A000, End: 0x06A3FF, Country: "Qatar", FlagImage: "Qatar.png" },
        { Start: 0x718000, End: 0x71FFFF, Country: "Republic of Korea", FlagImage: "South_Korea.png" },
        { Start: 0x504C00, End: 0x504FFF, Country: "Republic of Moldova", FlagImage: "Moldova.png" },
        { Start: 0x4A0000, End: 0x4A7FFF, Country: "Romania", FlagImage: "Romania.png" },
        { Start: 0x100000, End: 0x1FFFFF, Country: "Russian Federation", FlagImage: "Russian_Federation.png" },
        { Start: 0x06E000, End: 0x06EFFF, Country: "Rwanda", FlagImage: "Rwanda.png" },
        { Start: 0xC8C000, End: 0xC8C3FF, Country: "Saint Lucia", FlagImage: "Saint_Lucia.png" },
        { Start: 0x0BC000, End: 0x0BC3FF, Country: "Saint Vincent and the Grenadines", FlagImage: "Saint_Vincent_and_the_Grenadines.png" },
        { Start: 0x902000, End: 0x9023FF, Country: "Samoa", FlagImage: "Samoa.png" },
        { Start: 0x500000, End: 0x5003FF, Country: "San Marino", FlagImage: "San_Marino.png" },
        { Start: 0x09E000, End: 0x09E3FF, Country: "Sao Tome and Principe", FlagImage: "Sao_Tome_and_Principe.png" },
        { Start: 0x710000, End: 0x717FFF, Country: "Saudi Arabia", FlagImage: "Saudi_Arabia.png" },
        { Start: 0x070000, End: 0x070FFF, Country: "Senegal", FlagImage: "Senegal.png" },
        { Start: 0x4C0000, End: 0x4C7FFF, Country: "Serbia", FlagImage: "Serbia.png" },
        { Start: 0x074000, End: 0x0743FF, Country: "Seychelles", FlagImage: "Seychelles.png" },
        { Start: 0x076000, End: 0x0763FF, Country: "Sierra Leone", FlagImage: "Sierra_Leone.png" },
        { Start: 0x768000, End: 0x76FFFF, Country: "Singapore", FlagImage: "Singapore.png" },
        { Start: 0x505C00, End: 0x505FFF, Country: "Slovakia", FlagImage: "Slovakia.png" },
        { Start: 0x506C00, End: 0x506FFF, Country: "Slovenia", FlagImage: "Slovenia.png" },
        { Start: 0x897000, End: 0x8973FF, Country: "Solomon Islands", FlagImage: "Soloman_Islands.png" }, // flag typo?
        { Start: 0x078000, End: 0x078FFF, Country: "Somalia", FlagImage: "Somalia.png" },
        { Start: 0x008000, End: 0x00FFFF, Country: "South Africa", FlagImage: "South_Africa.png" },
        { Start: 0x340000, End: 0x37FFFF, Country: "Spain", FlagImage: "Spain.png" },
        { Start: 0x770000, End: 0x777FFF, Country: "Sri Lanka", FlagImage: "Sri_Lanka.png" },
        { Start: 0x07C000, End: 0x07CFFF, Country: "Sudan", FlagImage: "Sudan.png" },
        { Start: 0x0C8000, End: 0x0C8FFF, Country: "Suriname", FlagImage: "Suriname.png" },
        { Start: 0x07A000, End: 0x07A3FF, Country: "Swaziland", FlagImage: "Swaziland.png" },
        { Start: 0x4A8000, End: 0x4AFFFF, Country: "Sweden", FlagImage: "Sweden.png" },
        { Start: 0x4B0000, End: 0x4B7FFF, Country: "Switzerland", FlagImage: "Switzerland.png" },
        { Start: 0x778000, End: 0x77FFFF, Country: "Syrian Arab Republic", FlagImage: "Syria.png" },
        { Start: 0x515000, End: 0x5153FF, Country: "Tajikistan", FlagImage: "Tajikistan.png" },
        { Start: 0x880000, End: 0x887FFF, Country: "Thailand", FlagImage: "Thailand.png" },
        { Start: 0x512000, End: 0x5123FF, Country: "The former Yugoslav Republic of Macedonia", FlagImage: "Macedonia.png" },
        { Start: 0x088000, End: 0x088FFF, Country: "Togo", FlagImage: "Togo.png" },
        { Start: 0xC8D000, End: 0xC8D3FF, Country: "Tonga", FlagImage: "Tonga.png" },
        { Start: 0x0C6000, End: 0x0C6FFF, Country: "Trinidad and Tobago", FlagImage: "Trinidad_and_Tobago.png" },
        { Start: 0x028000, End: 0x02FFFF, Country: "Tunisia", FlagImage: "Tunisia.png" },
        { Start: 0x4B8000, End: 0x4BFFFF, Country: "Turkey", FlagImage: "Turkey.png" },
        { Start: 0x601800, End: 0x601BFF, Country: "Turkmenistan", FlagImage: "Turkmenistan.png" },
        { Start: 0x068000, End: 0x068FFF, Country: "Uganda", FlagImage: "Uganda.png" },
        { Start: 0x508000, End: 0x50FFFF, Country: "Ukraine", FlagImage: "Ukraine.png" },
        { Start: 0x896000, End: 0x896FFF, Country: "United Arab Emirates", FlagImage: "UAE.png" },
        { Start: 0x400000, End: 0x43FFFF, Country: "United Kingdom", FlagImage: "United_Kingdom.png" },
        { Start: 0x080000, End: 0x080FFF, Country: "United Republic of Tanzania", FlagImage: "Tanzania.png" },
        { Start: 0xA00000, End: 0xAFFFFF, Country: "United States", FlagImage: "United_States_of_America.png" },
        { Start: 0xE90000, End: 0xE90FFF, Country: "Uruguay", FlagImage: "Uruguay.png" },
        { Start: 0x507C00, End: 0x507FFF, Country: "Uzbekistan", FlagImage: "Uzbekistan.png" },
        { Start: 0xC90000, End: 0xC903FF, Country: "Vanuatu", FlagImage: "Vanuatu.png" },
        { Start: 0x0D8000, End: 0x0DFFFF, Country: "Venezuela", FlagImage: "Venezuela.png" },
        { Start: 0x888000, End: 0x88FFFF, Country: "Viet Nam", FlagImage: "Vietnam.png" },
        { Start: 0x890000, End: 0x890FFF, Country: "Yemen", FlagImage: "Yemen.png" },
        { Start: 0x08A000, End: 0x08AFFF, Country: "Zambia", FlagImage: "Zambia.png" },
        { Start: 0x004000, End: 0x0043FF, Country: "Zimbabwe", FlagImage: "Zimbabwe.png" },

        { Start: 0xF00000, End: 0xF07FFF, Country: "ICAO (temporary assignments)", FlagImage: "blank.png" },
        { Start: 0xF09000, End: 0xF093FF, Country: "ICAO (special use)", FlagImage: "blank.png" },

        // Block assignments mentioned in Chapter 9 section 4, at the end so they are only used if
        // nothing above applies
        { Start: 0x200000, End: 0x27FFFF, Country: "Unassigned (AFI region)", FlagImage: "blank.png" },
        { Start: 0x280000, End: 0x28FFFF, Country: "Unassigned (SAM region)", FlagImage: "blank.png" },
        { Start: 0x500000, End: 0x5FFFFF, Country: "Unassigned (EUR / NAT regions)", FlagImage: "blank.png" },
        { Start: 0x600000, End: 0x67FFFF, Country: "Unassigned (MID region)", FlagImage: "blank.png" },
        { Start: 0x680000, End: 0x6FFFFF, Country: "Unassigned (ASIA region)", FlagImage: "blank.png" },
        { Start: 0x900000, End: 0x9FFFFF, Country: "Unassigned (NAM / PAC regions)", FlagImage: "blank.png" },
        { Start: 0xB00000, End: 0xBFFFFF, Country: "Unassigned (reserved for future use)", FlagImage: "blank.png" },
        { Start: 0xEC0000, End: 0xEFFFFF, Country: "Unassigned (CAR region)", FlagImage: "blank.png" },
        { Start: 0xD00000, End: 0xDFFFFF, Country: "Unassigned (reserved for future use)", FlagImage: "blank.png" },
        { Start: 0xF00000, End: 0xFFFFFF, Country: "Unassigned (reserved for future use)", FlagImage: "blank.png" },
    ];

    const unassignedRange: IIcaoRange = {
        Country: "Unassigned",
        End: 0,
        FlagImage: "blank.png",
        Start: 0,
    };

    /**
     * Given a (hex string) ICAO address,
     * return an object describing that ICAO range.
     * Always returns a non-null object.
     * (todo: binary search)
     */
    export function FindIcaoRange(icao: string): IIcaoRange {
        const hexa = +("0x" + icao);

        for (const range of icaoRanges) {
            if (hexa >= range.Start && hexa <= range.End) {
                return range;
            }
        }

        return unassignedRange;
    }
}
