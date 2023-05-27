import * as utils from './complexUtils';
import fs from 'fs';
import * as d from 'discord.js';
import { getTitleAndEpisodes } from './routes/utils';
import { get } from 'request';
import discordModals,{ Modal, TextInputComponent, SelectMenuComponent } from 'discord-modals';
const url =
  'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC48.6%E8%A9%B1%E3%80%91%E3%82%A8%E3%83%AB%E3%83%95%E3%81%95%E3%82%93%E3%81%AF%E7%97%A9%E3%81%9B%E3%82%89%E3%82%8C%E3%81%AA%E3%81%84%E3%80%82-raw/';

const createModal = () => {
  const modal = new d.ModalBuilder().setCustomId( 'myModal' ).setTitle( 'My Modal' );
  const favoriteColorInput = new d.TextInputBuilder()
    .setCustomId( 'favoriteColorInput' )
    // The label is the prompt the user sees for this input
    .setLabel( "What's your favorite color?" )
    // Short means only a single line of text
    .setStyle( d.TextInputStyle.Short );
  const hobbiesInput = new d.TextInputBuilder()
    .setCustomId( 'hobbiesInput' )
    .setLabel( "What's some of your favorite hobbies?" )
    // Paragraph means multiple lines of text.
    .setStyle( d.TextInputStyle.Paragraph );
  const button = new d.ButtonBuilder().setStyle( d.ButtonStyle.Primary ).setLabel( 'Select me!' ).setCustomId( 'button' );
  const select = new d.StringSelectMenuBuilder().addOptions(
    {
      label: 'Select me!',
      value: 'selectMe',
    },
    {
      label: 'No, select me!',
      value: 'selectMeInstead',
    }
  ).setCustomId( 'selectMenu' );
  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow =
    new d.ActionRowBuilder<d.ModalActionRowComponentBuilder>().addComponents(
      favoriteColorInput,
      hobbiesInput
    );
  const secondActionRow =
    new d.ActionRowBuilder<d.MessageActionRowComponentBuilder>().setComponents( button, select )
  modal.addComponents( firstActionRow );
  modal.addComponents()
  const modalObj = modal.toJSON();
  fs.writeFileSync( 'modal.json', JSON.stringify( modalObj, null, 2 ) );
  // Add inputs to the modal
  console.log( modal );
};

( async () => {
  console.log('unko');
} )();
