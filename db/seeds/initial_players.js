/**
 * Seed data for players table
 */

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('players').del();
  
  // Insert seed data
  await knex('players').insert([
    {
      name: 'Archie Manning Jr.',
      position: 'QB',
      previous_school: 'Louisiana Tech',
      eligibility: 'Junior',
      height: '6\'2"',
      weight: '205',
      hometown: 'New Orleans, LA',
      status: 'Entered',
      entered_date: new Date('2025-01-15'),
      nil_value: 250000,
      notes: 'Strong-armed quarterback with excellent mobility'
    },
    {
      name: 'Tyrone Williams',
      position: 'WR',
      previous_school: 'Alabama',
      eligibility: 'Graduate',
      height: '6\'4"',
      weight: '215',
      hometown: 'Houston, TX',
      status: 'Committed',
      entered_date: new Date('2025-01-10'),
      nil_value: 175000,
      notes: 'Deep threat receiver with great hands'
    },
    {
      name: 'Marcus Johnson',
      position: 'RB',
      previous_school: 'Michigan',
      eligibility: 'Senior',
      height: '5\'11"',
      weight: '220',
      hometown: 'Dallas, TX',
      status: 'Entered',
      entered_date: new Date('2025-01-20'),
      nil_value: 125000,
      notes: 'Powerful runner with good vision'
    }
  ]);
}; 