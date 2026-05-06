async function seed() {
  const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const DEFAULT_TASKS = [
    {
      title: 'Complete Calculus Assignment',
      priority: 'high',
      deadline: daysFromNow(1),
      subject: 'Math',
      completed: false,
      createdAt: Date.now() - 50000,
    },
    {
      title: 'Read Chapter 5 – Organic Chemistry',
      priority: 'medium',
      deadline: daysFromNow(2),
      subject: 'Science',
      completed: false,
      createdAt: Date.now() - 80000,
    },
    {
      title: 'Essay Draft – Shakespeare',
      priority: 'high',
      deadline: daysFromNow(3),
      subject: 'English',
      completed: false,
      createdAt: Date.now() - 100000,
    },
  ];

  for (const t of DEFAULT_TASKS) {
    try {
      const res = await fetch('http://localhost:5175/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      const json = await res.json();
      console.log('seeded', json.id || json.title);
    } catch (e) {
      console.error('seed failed', e);
    }
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
