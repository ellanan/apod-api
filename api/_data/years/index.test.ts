import { dataDictionary, isoDates, dailyData } from './index';

describe('yearly data imports', () => {
  it('loads data from all years', () => {
    expect(Object.keys(dataDictionary).length).toBeGreaterThan(10000);
  });

  it('has isoDates array matching dictionary keys', () => {
    expect(isoDates).toEqual(Object.keys(dataDictionary));
  });

  it('has dailyData array matching dictionary values', () => {
    expect(dailyData).toEqual(Object.values(dataDictionary));
  });

  it('has entries with expected shape', () => {
    const sampleEntry = dataDictionary['2025-01-01'];
    expect(sampleEntry).toHaveProperty('title');
    expect(sampleEntry).toHaveProperty('date', '2025-01-01');
    expect(sampleEntry).toHaveProperty('media_type');
    expect(sampleEntry).toHaveProperty('service_version', 'v1');
  });

  it('has dates in chronological order', () => {
    const firstDate = isoDates[0];
    const lastDate = isoDates[isoDates.length - 1];
    expect(firstDate).toBe('1995-06-16');
    expect(lastDate >= '2025-01-01').toBe(true);
  });
});
