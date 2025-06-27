'use client';

import React from 'react';

export default function Page2() {
  return (
    <div style={{ padding: '4rem 3rem 2rem 3rem', maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Generic Page 2</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Section Title</h2>
      <p style={{ marginBottom: '2rem' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut laoreet dictum, massa erat ultricies enim, nec facilisis enim urna at velit.
      </p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Another Section</h2>
      <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
        <li><strong>Item 1:</strong> Lorem ipsum dolor sit amet, consectetur.</li>
        <li><strong>Item 2:</strong> Lorem ipsum dolor sit amet, consectetur.</li>
        <li><strong>Item 3:</strong> Lorem ipsum dolor sit amet, consectetur.</li>
      </ul>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Contact</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam nisl nisi eu nunc.
      </p>
    </div>
  );
}
