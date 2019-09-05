// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// Declare ICAO registration address ranges and Country.
// Iinstall the flag images in flags-tiny subdirectory.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
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
// Declare ICAO registration address ranges and Country

const IcaoRanges = [
  // Mostly generated from the assignment table in the appEndix to Chapter 9 of
  // Annex 10 Vol III, Second Edition, July 2007 (with amEndments through 88-A, 14/11/2013)
  {
    Start: 0x700000,
    End: 0x700fff,
    Country: 'Afghanistan',
    FlagImage: 'Afghanistan.png',
  },
  {
    Start: 0x501000,
    End: 0x5013ff,
    Country: 'Albania',
    FlagImage: 'Albania.png',
  },
  {
    Start: 0x0a0000,
    End: 0x0a7fff,
    Country: 'Algeria',
    FlagImage: 'Algeria.png',
  },
  {
    Start: 0x090000,
    End: 0x090fff,
    Country: 'Angola',
    FlagImage: 'Angola.png',
  },
  {
    Start: 0x0ca000,
    End: 0x0ca3ff,
    Country: 'Antigua and Barbuda',
    FlagImage: 'Antigua_and_Barbuda.png',
  },
  {
    Start: 0xe00000,
    End: 0xe3ffff,
    Country: 'Argentina',
    FlagImage: 'Argentina.png',
  },
  {
    Start: 0x600000,
    End: 0x6003ff,
    Country: 'Armenia',
    FlagImage: 'Armenia.png',
  },
  {
    Start: 0x7c0000,
    End: 0x7fffff,
    Country: 'Australia',
    FlagImage: 'Australia.png',
  },
  {
    Start: 0x440000,
    End: 0x447fff,
    Country: 'Austria',
    FlagImage: 'Austria.png',
  },
  {
    Start: 0x600800,
    End: 0x600bff,
    Country: 'Azerbaijan',
    FlagImage: 'Azerbaijan.png',
  },
  {
    Start: 0x0a8000,
    End: 0x0a8fff,
    Country: 'Bahamas',
    FlagImage: 'Bahamas.png',
  },
  {
    Start: 0x894000,
    End: 0x894fff,
    Country: 'Bahrain',
    FlagImage: 'Bahrain.png',
  },
  {
    Start: 0x702000,
    End: 0x702fff,
    Country: 'Bangladesh',
    FlagImage: 'Bangladesh.png',
  },
  {
    Start: 0x0aa000,
    End: 0x0aa3ff,
    Country: 'Barbados',
    FlagImage: 'Barbados.png',
  },
  {
    Start: 0x510000,
    End: 0x5103ff,
    Country: 'Belarus',
    FlagImage: 'Belarus.png',
  },
  {
    Start: 0x448000,
    End: 0x44ffff,
    Country: 'Belgium',
    FlagImage: 'Belgium.png',
  },
  {
    Start: 0x0ab000,
    End: 0x0ab3ff,
    Country: 'Belize',
    FlagImage: 'Belize.png',
  },
  {
    Start: 0x094000,
    End: 0x0943ff,
    Country: 'Benin',
    FlagImage: 'Benin.png',
  },
  {
    Start: 0x680000,
    End: 0x6803ff,
    Country: 'Bhutan',
    FlagImage: 'Bhutan.png',
  },
  {
    Start: 0xe94000,
    End: 0xe94fff,
    Country: 'Bolivia',
    FlagImage: 'Bolivia.png',
  },
  {
    Start: 0x513000,
    End: 0x5133ff,
    Country: 'Bosnia and Herzegovina',
    FlagImage: 'Bosnia.png',
  },
  {
    Start: 0x030000,
    End: 0x0303ff,
    Country: 'Botswana',
    FlagImage: 'Botswana.png',
  },
  {
    Start: 0xe40000,
    End: 0xe7ffff,
    Country: 'Brazil',
    FlagImage: 'Brazil.png',
  },
  {
    Start: 0x895000,
    End: 0x8953ff,
    Country: 'Brunei Darussalam',
    FlagImage: 'Brunei.png',
  },
  {
    Start: 0x450000,
    End: 0x457fff,
    Country: 'Bulgaria',
    FlagImage: 'Bulgaria.png',
  },
  {
    Start: 0x09c000,
    End: 0x09cfff,
    Country: 'Burkina Faso',
    FlagImage: 'Burkina_Faso.png',
  },
  {
    Start: 0x032000,
    End: 0x032fff,
    Country: 'Burundi',
    FlagImage: 'Burundi.png',
  },
  {
    Start: 0x70e000,
    End: 0x70efff,
    Country: 'Cambodia',
    FlagImage: 'Cambodia.png',
  },
  {
    Start: 0x034000,
    End: 0x034fff,
    Country: 'Cameroon',
    FlagImage: 'Cameroon.png',
  },
  {
    Start: 0xc00000,
    End: 0xc3ffff,
    Country: 'Canada',
    FlagImage: 'Canada.png',
  },
  {
    Start: 0x096000,
    End: 0x0963ff,
    Country: 'Cape Verde',
    FlagImage: 'Cape_Verde.png',
  },
  {
    Start: 0x06c000,
    End: 0x06cfff,
    Country: 'Central African Republic',
    FlagImage: 'Central_African_Republic.png',
  },
  {
    Start: 0x084000,
    End: 0x084fff,
    Country: 'Chad',
    FlagImage: 'Chad.png',
  },
  {
    Start: 0xe80000,
    End: 0xe80fff,
    Country: 'Chile',
    FlagImage: 'Chile.png',
  },
  {
    Start: 0x780000,
    End: 0x7bffff,
    Country: 'China',
    FlagImage: 'China.png',
  },
  {
    Start: 0x0ac000,
    End: 0x0acfff,
    Country: 'Colombia',
    FlagImage: 'Colombia.png',
  },
  {
    Start: 0x035000,
    End: 0x0353ff,
    Country: 'Comoros',
    FlagImage: 'Comoros.png',
  },
  {
    Start: 0x036000,
    End: 0x036fff,
    Country: 'Congo',
    FlagImage: 'Republic_of_the_Congo.png',
  }, // probably?
  {
    Start: 0x901000,
    End: 0x9013ff,
    Country: 'Cook Islands',
    FlagImage: 'Cook_Islands.png',
  },
  {
    Start: 0x0ae000,
    End: 0x0aefff,
    Country: 'Costa Rica',
    FlagImage: 'Costa_Rica.png',
  },
  {
    Start: 0x038000,
    End: 0x038fff,
    Country: "Cote d'Ivoire",
    FlagImage: 'Cote_d_Ivoire.png',
  },
  {
    Start: 0x501c00,
    End: 0x501fff,
    Country: 'Croatia',
    FlagImage: 'Croatia.png',
  },
  {
    Start: 0x0b0000,
    End: 0x0b0fff,
    Country: 'Cuba',
    FlagImage: 'Cuba.png',
  },
  {
    Start: 0x4c8000,
    End: 0x4c83ff,
    Country: 'Cyprus',
    FlagImage: 'Cyprus.png',
  },
  {
    Start: 0x498000,
    End: 0x49ffff,
    Country: 'Czech Republic',
    FlagImage: 'Czech_Republic.png',
  },
  {
    Start: 0x720000,
    End: 0x727fff,
    Country: "Democratic People's Republic of Korea",
    FlagImage: 'North_Korea.png',
  },
  {
    Start: 0x08c000,
    End: 0x08cfff,
    Country: 'Democratic Republic of the Congo',
    FlagImage: 'Democratic_Republic_of_the_Congo.png',
  },
  {
    Start: 0x458000,
    End: 0x45ffff,
    Country: 'Denmark',
    FlagImage: 'Denmark.png',
  },
  {
    Start: 0x098000,
    End: 0x0983ff,
    Country: 'Djibouti',
    FlagImage: 'Djibouti.png',
  },
  {
    Start: 0x0c4000,
    End: 0x0c4fff,
    Country: 'Dominican Republic',
    FlagImage: 'Dominican_Republic.png',
  },
  {
    Start: 0xe84000,
    End: 0xe84fff,
    Country: 'Ecuador',
    FlagImage: 'Ecuador.png',
  },
  {
    Start: 0x010000,
    End: 0x017fff,
    Country: 'Egypt',
    FlagImage: 'Egypt.png',
  },
  {
    Start: 0x0b2000,
    End: 0x0b2fff,
    Country: 'El Salvador',
    FlagImage: 'El_Salvador.png',
  },
  {
    Start: 0x042000,
    End: 0x042fff,
    Country: 'Equatorial Guinea',
    FlagImage: 'Equatorial_Guinea.png',
  },
  {
    Start: 0x202000,
    End: 0x2023ff,
    Country: 'Eritrea',
    FlagImage: 'Eritrea.png',
  },
  {
    Start: 0x511000,
    End: 0x5113ff,
    Country: 'Estonia',
    FlagImage: 'Estonia.png',
  },
  {
    Start: 0x040000,
    End: 0x040fff,
    Country: 'Ethiopia',
    FlagImage: 'Ethiopia.png',
  },
  {
    Start: 0xc88000,
    End: 0xc88fff,
    Country: 'Fiji',
    FlagImage: 'Fiji.png',
  },
  {
    Start: 0x460000,
    End: 0x467fff,
    Country: 'Finland',
    FlagImage: 'Finland.png',
  },
  {
    Start: 0x380000,
    End: 0x3bffff,
    Country: 'France',
    FlagImage: 'France.png',
  },
  {
    Start: 0x03e000,
    End: 0x03efff,
    Country: 'Gabon',
    FlagImage: 'Gabon.png',
  },
  {
    Start: 0x09a000,
    End: 0x09afff,
    Country: 'Gambia',
    FlagImage: 'Gambia.png',
  },
  {
    Start: 0x514000,
    End: 0x5143ff,
    Country: 'Georgia',
    FlagImage: 'Georgia.png',
  },
  {
    Start: 0x3c0000,
    End: 0x3fffff,
    Country: 'Germany',
    FlagImage: 'Germany.png',
  },
  {
    Start: 0x044000,
    End: 0x044fff,
    Country: 'Ghana',
    FlagImage: 'Ghana.png',
  },
  {
    Start: 0x468000,
    End: 0x46ffff,
    Country: 'Greece',
    FlagImage: 'Greece.png',
  },
  {
    Start: 0x0cc000,
    End: 0x0cc3ff,
    Country: 'Grenada',
    FlagImage: 'Grenada.png',
  },
  {
    Start: 0x0b4000,
    End: 0x0b4fff,
    Country: 'Guatemala',
    FlagImage: 'Guatemala.png',
  },
  {
    Start: 0x046000,
    End: 0x046fff,
    Country: 'Guinea',
    FlagImage: 'Guinea.png',
  },
  {
    Start: 0x048000,
    End: 0x0483ff,
    Country: 'Guinea-Bissau',
    FlagImage: 'Guinea_Bissau.png',
  },
  {
    Start: 0x0b6000,
    End: 0x0b6fff,
    Country: 'Guyana',
    FlagImage: 'Guyana.png',
  },
  {
    Start: 0x0b8000,
    End: 0x0b8fff,
    Country: 'Haiti',
    FlagImage: 'Haiti.png',
  },
  {
    Start: 0x0ba000,
    End: 0x0bafff,
    Country: 'Honduras',
    FlagImage: 'Honduras.png',
  },
  {
    Start: 0x470000,
    End: 0x477fff,
    Country: 'Hungary',
    FlagImage: 'Hungary.png',
  },
  {
    Start: 0x4cc000,
    End: 0x4ccfff,
    Country: 'Iceland',
    FlagImage: 'Iceland.png',
  },
  {
    Start: 0x800000,
    End: 0x83ffff,
    Country: 'India',
    FlagImage: 'India.png',
  },
  {
    Start: 0x8a0000,
    End: 0x8a7fff,
    Country: 'Indonesia',
    FlagImage: 'Indonesia.png',
  },
  {
    Start: 0x730000,
    End: 0x737fff,
    Country: 'Iran, Islamic Republic of',
    FlagImage: 'Iran.png',
  },
  {
    Start: 0x728000,
    End: 0x72ffff,
    Country: 'Iraq',
    FlagImage: 'Iraq.png',
  },
  {
    Start: 0x4ca000,
    End: 0x4cafff,
    Country: 'Ireland',
    FlagImage: 'Ireland.png',
  },
  {
    Start: 0x738000,
    End: 0x73ffff,
    Country: 'Israel',
    FlagImage: 'Israel.png',
  },
  {
    Start: 0x300000,
    End: 0x33ffff,
    Country: 'Italy',
    FlagImage: 'Italy.png',
  },
  {
    Start: 0x0be000,
    End: 0x0befff,
    Country: 'Jamaica',
    FlagImage: 'Jamaica.png',
  },
  {
    Start: 0x840000,
    End: 0x87ffff,
    Country: 'Japan',
    FlagImage: 'Japan.png',
  },
  {
    Start: 0x740000,
    End: 0x747fff,
    Country: 'Jordan',
    FlagImage: 'Jordan.png',
  },
  {
    Start: 0x683000,
    End: 0x6833ff,
    Country: 'Kazakhstan',
    FlagImage: 'Kazakhstan.png',
  },
  {
    Start: 0x04c000,
    End: 0x04cfff,
    Country: 'Kenya',
    FlagImage: 'Kenya.png',
  },
  {
    Start: 0xc8e000,
    End: 0xc8e3ff,
    Country: 'Kiribati',
    FlagImage: 'Kiribati.png',
  },
  {
    Start: 0x706000,
    End: 0x706fff,
    Country: 'Kuwait',
    FlagImage: 'Kuwait.png',
  },
  {
    Start: 0x601000,
    End: 0x6013ff,
    Country: 'Kyrgyzstan',
    FlagImage: 'Kyrgyzstan.png',
  },
  {
    Start: 0x708000,
    End: 0x708fff,
    Country: "Lao People's Democratic Republic",
    FlagImage: 'Laos.png',
  },
  {
    Start: 0x502c00,
    End: 0x502fff,
    Country: 'Latvia',
    FlagImage: 'Latvia.png',
  },
  {
    Start: 0x748000,
    End: 0x74ffff,
    Country: 'Lebanon',
    FlagImage: 'Lebanon.png',
  },
  {
    Start: 0x04a000,
    End: 0x04a3ff,
    Country: 'Lesotho',
    FlagImage: 'Lesotho.png',
  },
  {
    Start: 0x050000,
    End: 0x050fff,
    Country: 'Liberia',
    FlagImage: 'Liberia.png',
  },
  {
    Start: 0x018000,
    End: 0x01ffff,
    Country: 'Libyan Arab Jamahiriya',
    FlagImage: 'Libya.png',
  },
  {
    Start: 0x503c00,
    End: 0x503fff,
    Country: 'Lithuania',
    FlagImage: 'Lithuania.png',
  },
  {
    Start: 0x4d0000,
    End: 0x4d03ff,
    Country: 'Luxembourg',
    FlagImage: 'Luxembourg.png',
  },
  {
    Start: 0x054000,
    End: 0x054fff,
    Country: 'Madagascar',
    FlagImage: 'Madagascar.png',
  },
  {
    Start: 0x058000,
    End: 0x058fff,
    Country: 'Malawi',
    FlagImage: 'Malawi.png',
  },
  {
    Start: 0x750000,
    End: 0x757fff,
    Country: 'Malaysia',
    FlagImage: 'Malaysia.png',
  },
  {
    Start: 0x05a000,
    End: 0x05a3ff,
    Country: 'Maldives',
    FlagImage: 'Maldives.png',
  },
  {
    Start: 0x05c000,
    End: 0x05cfff,
    Country: 'Mali',
    FlagImage: 'Mali.png',
  },
  {
    Start: 0x4d2000,
    End: 0x4d23ff,
    Country: 'Malta',
    FlagImage: 'Malta.png',
  },
  {
    Start: 0x900000,
    End: 0x9003ff,
    Country: 'Marshall Islands',
    FlagImage: 'Marshall_Islands.png',
  },
  {
    Start: 0x05e000,
    End: 0x05e3ff,
    Country: 'Mauritania',
    FlagImage: 'Mauritania.png',
  },
  {
    Start: 0x060000,
    End: 0x0603ff,
    Country: 'Mauritius',
    FlagImage: 'Mauritius.png',
  },
  {
    Start: 0x0d0000,
    End: 0x0d7fff,
    Country: 'Mexico',
    FlagImage: 'Mexico.png',
  },
  {
    Start: 0x681000,
    End: 0x6813ff,
    Country: 'Micronesia, Federated States of',
    FlagImage: 'Micronesia.png',
  },
  {
    Start: 0x4d4000,
    End: 0x4d43ff,
    Country: 'Monaco',
    FlagImage: 'Monaco.png',
  },
  {
    Start: 0x682000,
    End: 0x6823ff,
    Country: 'Mongolia',
    FlagImage: 'Mongolia.png',
  },
  {
    Start: 0x516000,
    End: 0x5163ff,
    Country: 'Montenegro',
    FlagImage: 'Montenegro.png',
  },
  {
    Start: 0x020000,
    End: 0x027fff,
    Country: 'Morocco',
    FlagImage: 'Morocco.png',
  },
  {
    Start: 0x006000,
    End: 0x006fff,
    Country: 'Mozambique',
    FlagImage: 'Mozambique.png',
  },
  {
    Start: 0x704000,
    End: 0x704fff,
    Country: 'Myanmar',
    FlagImage: 'Myanmar.png',
  },
  {
    Start: 0x201000,
    End: 0x2013ff,
    Country: 'Namibia',
    FlagImage: 'Namibia.png',
  },
  {
    Start: 0xc8a000,
    End: 0xc8a3ff,
    Country: 'Nauru',
    FlagImage: 'Nauru.png',
  },
  {
    Start: 0x70a000,
    End: 0x70afff,
    Country: 'Nepal',
    FlagImage: 'Nepal.png',
  },
  {
    Start: 0x480000,
    End: 0x487fff,
    Country: 'Netherlands, Kingdom of the',
    FlagImage: 'Netherlands.png',
  },
  {
    Start: 0xc80000,
    End: 0xc87fff,
    Country: 'New Zealand',
    FlagImage: 'New_Zealand.png',
  },
  {
    Start: 0x0c0000,
    End: 0x0c0fff,
    Country: 'Nicaragua',
    FlagImage: 'Nicaragua.png',
  },
  {
    Start: 0x062000,
    End: 0x062fff,
    Country: 'Niger',
    FlagImage: 'Niger.png',
  },
  {
    Start: 0x064000,
    End: 0x064fff,
    Country: 'Nigeria',
    FlagImage: 'Nigeria.png',
  },
  {
    Start: 0x478000,
    End: 0x47ffff,
    Country: 'Norway',
    FlagImage: 'Norway.png',
  },
  {
    Start: 0x70c000,
    End: 0x70c3ff,
    Country: 'Oman',
    FlagImage: 'Oman.png',
  },
  {
    Start: 0x760000,
    End: 0x767fff,
    Country: 'Pakistan',
    FlagImage: 'Pakistan.png',
  },
  {
    Start: 0x684000,
    End: 0x6843ff,
    Country: 'Palau',
    FlagImage: 'Palau.png',
  },
  {
    Start: 0x0c2000,
    End: 0x0c2fff,
    Country: 'Panama',
    FlagImage: 'Panama.png',
  },
  {
    Start: 0x898000,
    End: 0x898fff,
    Country: 'Papua New Guinea',
    FlagImage: 'Papua_New_Guinea.png',
  },
  {
    Start: 0xe88000,
    End: 0xe88fff,
    Country: 'Paraguay',
    FlagImage: 'Paraguay.png',
  },
  {
    Start: 0xe8c000,
    End: 0xe8cfff,
    Country: 'Peru',
    FlagImage: 'Peru.png',
  },
  {
    Start: 0x758000,
    End: 0x75ffff,
    Country: 'Philippines',
    FlagImage: 'Philippines.png',
  },
  {
    Start: 0x488000,
    End: 0x48ffff,
    Country: 'Poland',
    FlagImage: 'Poland.png',
  },
  {
    Start: 0x490000,
    End: 0x497fff,
    Country: 'Portugal',
    FlagImage: 'Portugal.png',
  },
  {
    Start: 0x06a000,
    End: 0x06a3ff,
    Country: 'Qatar',
    FlagImage: 'Qatar.png',
  },
  {
    Start: 0x718000,
    End: 0x71ffff,
    Country: 'Republic of Korea',
    FlagImage: 'South_Korea.png',
  },
  {
    Start: 0x504c00,
    End: 0x504fff,
    Country: 'Republic of Moldova',
    FlagImage: 'Moldova.png',
  },
  {
    Start: 0x4a0000,
    End: 0x4a7fff,
    Country: 'Romania',
    FlagImage: 'Romania.png',
  },
  {
    Start: 0x100000,
    End: 0x1fffff,
    Country: 'Russian Federation',
    FlagImage: 'Russian_Federation.png',
  },
  {
    Start: 0x06e000,
    End: 0x06efff,
    Country: 'Rwanda',
    FlagImage: 'Rwanda.png',
  },
  {
    Start: 0xc8c000,
    End: 0xc8c3ff,
    Country: 'Saint Lucia',
    FlagImage: 'Saint_Lucia.png',
  },
  {
    Start: 0x0bc000,
    End: 0x0bc3ff,
    Country: 'Saint Vincent and the Grenadines',
    FlagImage: 'Saint_Vincent_and_the_Grenadines.png',
  },
  {
    Start: 0x902000,
    End: 0x9023ff,
    Country: 'Samoa',
    FlagImage: 'Samoa.png',
  },
  {
    Start: 0x500000,
    End: 0x5003ff,
    Country: 'San Marino',
    FlagImage: 'San_Marino.png',
  },
  {
    Start: 0x09e000,
    End: 0x09e3ff,
    Country: 'Sao Tome and Principe',
    FlagImage: 'Sao_Tome_and_Principe.png',
  },
  {
    Start: 0x710000,
    End: 0x717fff,
    Country: 'Saudi Arabia',
    FlagImage: 'Saudi_Arabia.png',
  },
  {
    Start: 0x070000,
    End: 0x070fff,
    Country: 'Senegal',
    FlagImage: 'Senegal.png',
  },
  {
    Start: 0x4c0000,
    End: 0x4c7fff,
    Country: 'Serbia',
    FlagImage: 'Serbia.png',
  },
  {
    Start: 0x074000,
    End: 0x0743ff,
    Country: 'Seychelles',
    FlagImage: 'Seychelles.png',
  },
  {
    Start: 0x076000,
    End: 0x0763ff,
    Country: 'Sierra Leone',
    FlagImage: 'Sierra_Leone.png',
  },
  {
    Start: 0x768000,
    End: 0x76ffff,
    Country: 'Singapore',
    FlagImage: 'Singapore.png',
  },
  {
    Start: 0x505c00,
    End: 0x505fff,
    Country: 'Slovakia',
    FlagImage: 'Slovakia.png',
  },
  {
    Start: 0x506c00,
    End: 0x506fff,
    Country: 'Slovenia',
    FlagImage: 'Slovenia.png',
  },
  {
    Start: 0x897000,
    End: 0x8973ff,
    Country: 'Solomon Islands',
    FlagImage: 'Soloman_Islands.png',
  }, // flag typo?
  {
    Start: 0x078000,
    End: 0x078fff,
    Country: 'Somalia',
    FlagImage: 'Somalia.png',
  },
  {
    Start: 0x008000,
    End: 0x00ffff,
    Country: 'South Africa',
    FlagImage: 'South_Africa.png',
  },
  {
    Start: 0x340000,
    End: 0x37ffff,
    Country: 'Spain',
    FlagImage: 'Spain.png',
  },
  {
    Start: 0x770000,
    End: 0x777fff,
    Country: 'Sri Lanka',
    FlagImage: 'Sri_Lanka.png',
  },
  {
    Start: 0x07c000,
    End: 0x07cfff,
    Country: 'Sudan',
    FlagImage: 'Sudan.png',
  },
  {
    Start: 0x0c8000,
    End: 0x0c8fff,
    Country: 'Suriname',
    FlagImage: 'Suriname.png',
  },
  {
    Start: 0x07a000,
    End: 0x07a3ff,
    Country: 'Swaziland',
    FlagImage: 'Swaziland.png',
  },
  {
    Start: 0x4a8000,
    End: 0x4affff,
    Country: 'Sweden',
    FlagImage: 'Sweden.png',
  },
  {
    Start: 0x4b0000,
    End: 0x4b7fff,
    Country: 'Switzerland',
    FlagImage: 'Switzerland.png',
  },
  {
    Start: 0x778000,
    End: 0x77ffff,
    Country: 'Syrian Arab Republic',
    FlagImage: 'Syria.png',
  },
  {
    Start: 0x515000,
    End: 0x5153ff,
    Country: 'Tajikistan',
    FlagImage: 'Tajikistan.png',
  },
  {
    Start: 0x880000,
    End: 0x887fff,
    Country: 'Thailand',
    FlagImage: 'Thailand.png',
  },
  {
    Start: 0x512000,
    End: 0x5123ff,
    Country: 'The former Yugoslav Republic of Macedonia',
    FlagImage: 'Macedonia.png',
  },
  {
    Start: 0x088000,
    End: 0x088fff,
    Country: 'Togo',
    FlagImage: 'Togo.png',
  },
  {
    Start: 0xc8d000,
    End: 0xc8d3ff,
    Country: 'Tonga',
    FlagImage: 'Tonga.png',
  },
  {
    Start: 0x0c6000,
    End: 0x0c6fff,
    Country: 'Trinidad and Tobago',
    FlagImage: 'Trinidad_and_Tobago.png',
  },
  {
    Start: 0x028000,
    End: 0x02ffff,
    Country: 'Tunisia',
    FlagImage: 'Tunisia.png',
  },
  {
    Start: 0x4b8000,
    End: 0x4bffff,
    Country: 'Turkey',
    FlagImage: 'Turkey.png',
  },
  {
    Start: 0x601800,
    End: 0x601bff,
    Country: 'Turkmenistan',
    FlagImage: 'Turkmenistan.png',
  },
  {
    Start: 0x068000,
    End: 0x068fff,
    Country: 'Uganda',
    FlagImage: 'Uganda.png',
  },
  {
    Start: 0x508000,
    End: 0x50ffff,
    Country: 'Ukraine',
    FlagImage: 'Ukraine.png',
  },
  {
    Start: 0x896000,
    End: 0x896fff,
    Country: 'United Arab Emirates',
    FlagImage: 'UAE.png',
  },
  {
    Start: 0x400000,
    End: 0x43ffff,
    Country: 'United Kingdom',
    FlagImage: 'United_Kingdom.png',
  },
  {
    Start: 0x080000,
    End: 0x080fff,
    Country: 'United Republic of Tanzania',
    FlagImage: 'Tanzania.png',
  },
  {
    Start: 0xa00000,
    End: 0xafffff,
    Country: 'United States',
    FlagImage: 'United_States_of_America.png',
  },
  {
    Start: 0xe90000,
    End: 0xe90fff,
    Country: 'Uruguay',
    FlagImage: 'Uruguay.png',
  },
  {
    Start: 0x507c00,
    End: 0x507fff,
    Country: 'Uzbekistan',
    FlagImage: 'Uzbekistan.png',
  },
  {
    Start: 0xc90000,
    End: 0xc903ff,
    Country: 'Vanuatu',
    FlagImage: 'Vanuatu.png',
  },
  {
    Start: 0x0d8000,
    End: 0x0dffff,
    Country: 'Venezuela',
    FlagImage: 'Venezuela.png',
  },
  {
    Start: 0x888000,
    End: 0x88ffff,
    Country: 'Viet Nam',
    FlagImage: 'Vietnam.png',
  },
  {
    Start: 0x890000,
    End: 0x890fff,
    Country: 'Yemen',
    FlagImage: 'Yemen.png',
  },
  {
    Start: 0x08a000,
    End: 0x08afff,
    Country: 'Zambia',
    FlagImage: 'Zambia.png',
  },
  {
    Start: 0x004000,
    End: 0x0043ff,
    Country: 'Zimbabwe',
    FlagImage: 'Zimbabwe.png',
  },

  {
    Start: 0xf00000,
    End: 0xf07fff,
    Country: 'ICAO (temporary assignments)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x899000,
    End: 0x8993ff,
    Country: 'ICAO (special use)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0xf09000,
    End: 0xf093ff,
    Country: 'ICAO (special use)',
    FlagImage: 'blank.png',
  },

  // Block assignments mentioned in Chapter 9 section 4, at the End so they are only used if
  // nothing above applies
  {
    Start: 0x200000,
    End: 0x27ffff,
    Country: 'Unassigned (AFI region)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x280000,
    End: 0x28ffff,
    Country: 'Unassigned (SAM region)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x500000,
    End: 0x5fffff,
    Country: 'Unassigned (EUR / NAT regions)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x600000,
    End: 0x67ffff,
    Country: 'Unassigned (MID region)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x680000,
    End: 0x6fffff,
    Country: 'Unassigned (ASIA region)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0x900000,
    End: 0x9fffff,
    Country: 'Unassigned (NAM / PAC regions)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0xb00000,
    End: 0xbfffff,
    Country: 'Unassigned (reserved for future use)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0xec0000,
    End: 0xefffff,
    Country: 'Unassigned (CAR region)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0xd00000,
    End: 0xdfffff,
    Country: 'Unassigned (reserved for future use)',
    FlagImage: 'blank.png',
  },
  {
    Start: 0xf00000,
    End: 0xffffff,
    Country: 'Unassigned (reserved for future use)',
    FlagImage: 'blank.png',
  },
];

const UnassignedRange = {
  Start: 0,
  End: 0,
  Country: 'Unassigned',
  FlagImage: null,
};

// Given a (hex string) ICAO address,
// return an object describing that ICAO range.
// Always returns a non-null object.
//   (todo: binary search)
export default function FindIcaoRange(icao) {
  const hexa = +`0x${icao}`;

  for (let i = 0; i < IcaoRanges.length; i += 1) {
    if (hexa >= IcaoRanges[i].Start && hexa <= IcaoRanges[i].End) {
      return IcaoRanges[i];
    }
  }

  return UnassignedRange;
}
