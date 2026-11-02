import palettes from './iphone-colors.json';
export function iphoneColors(name: string) {
  const model = Object.keys(palettes).sort((a,b) => b.length-a.length).find(model => new RegExp(`(?:^|\\b)${model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z0-9])`, 'i').test(name));
  return model ? palettes[model as keyof typeof palettes] : [];
}
