import * as request from './request';
import * as faq from './faq';
import * as smallTalk from './smallTalk';
import * as base from './base';

export const modules = {
  request: request.handleAction,
  faq: faq.handleAction,
  smallTalk: smallTalk.handleAction,
  base: base.handleAction,
}
