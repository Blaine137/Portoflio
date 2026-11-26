import data from '../data/portfolio.json';

export const portfolio = data;
export type Project = (typeof data.work.projects)[number];
export type ProfileLink = (typeof data.contact.profiles)[number];
