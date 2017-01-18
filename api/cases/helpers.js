import { logger } from '../logger';
import { Case } from './models';

export const createCase = (title, data, categoryId, constituentId, organizationId) => {
  return new Promise((resolve, reject) => {
    const newCase = {
      status: 'open',
      categoryId,
      constituentId,
      title,
      data,
    }
    Case.forge(newCase).save().then((res) => {
      logger.info(res);
      resolve();
    }).catch((err) => {
      logger.error(err);
      reject();
    });
  });
};

export const caseNotification = (passedCase) => {
  // If a city has email, use that, otherwise, slack it to us to follow up with the city on
  // if (this.get('organization').email) {
  //   let message = `Complaint:\n ${passedCase.text}`;
  //   if (passedCase.location) {
  //     message += `\nGeo-location: http://maps.google.com/maps?q=${passedCase.location.latitude},${passedCase.location.longitude}=${passedCase.location.latitude},${passedCase.location.longitude}`;
  //   }
  //   if (passedCase.attachments) {
  //     message += '\nAttachments:';
  //     passedCase.attachments.forEach((attachment, index) => {
  //       message += `${index + 1}: ${attachment.type || 'Attachment'} - ${attachment.payload.url}`;
  //     });
  //   }
  //   new EmailService().send('Constituent Complaint', message, 'mark@unitedworks.us', 'cases@mayor.chat');
  // } else {
  //   let message = `>*City*: ${this.get('organization').name}\n>*Constituent ID*: ${this.snapshot.constituent_id}\n>*Complaint*: ${passedCase.text}`;
  //   if (passedCase.location) {
  //     message += `\n>*Geo-location*: <http://maps.google.com/maps/place/${passedCase.location.latitude},${passedCase.location.longitude}|${passedCase.location.latitude},${passedCase.location.longitude}>`;
  //   }
  //   if (passedCase.attachments) {
  //     message += '\n>*Attachments*:';
  //     passedCase.attachments.forEach((attachment) => {
  //       message += ` <${attachment.payload.url}|${attachment.type || 'Attachment'}>`;
  //     });
  //   }
  //   new SlackService({
  //     username: 'Constituent Complaint',
  //     icon: 'rage',
  //   }).send(message);
  // }
}
