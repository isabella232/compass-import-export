import getShellJS from './get-shell-js';

describe('get-shell-js', () => {
  it('should support simple query', () => {
    const ret = getShellJS('test.people', { filter: { name: 'Arlo' } });
    const expected = `db.people.find(
  {name: 'Arlo'}
)`;
    expect(ret).to.equal(expected);
  });
  it('should support a projection', () => {
    const ret = getShellJS('test.people', {
      filter: { name: 'Arlo' },
      project: { name: 1 }
    });
    const expected = `db.people.find(
  {name: 'Arlo'},
  {name: 1}
)`;
    expect(ret).to.equal(expected);
  });
  it('should support a skip', () => {
    const ret = getShellJS('test.people', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100
    });
    const expected = `db.people.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100)`;

    expect(ret).to.equal(expected);
  });
  it('should support a limit', () => {
    const ret = getShellJS('test.people', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100,
      skip: 1
    });
    const expected = `db.people.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100).skip(1)`;

    expect(ret).to.equal(expected);
  });
});
