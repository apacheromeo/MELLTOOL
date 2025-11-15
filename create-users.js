#!/usr/bin/env node

/**
 * Script to create OWNER and MOD users
 * Usage: node create-users.js
 */

const API_URL = process.env.API_URL || 'https://melltool-backend.fly.dev';

async function createUser(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    console.log(`✅ Created ${userData.role} user: ${userData.email}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create ${userData.role} user: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating MELLTOOL users...\n');

  const users = [
    {
      email: 'owner@melltool.com',
      password: 'Owner123!',
      name: 'System Owner',
      role: 'OWNER',
    },
    {
      email: 'mod@melltool.com',
      password: 'Mod123!',
      name: 'Moderator',
      role: 'MOD',
    },
    {
      email: 'staff@melltool.com',
      password: 'Staff123!',
      name: 'Staff Member',
      role: 'STAFF',
    },
  ];

  for (const user of users) {
    try {
      await createUser(user);
    } catch (error) {
      console.error(`Continuing with next user...\n`);
    }
  }

  console.log('\n📊 User Creation Summary:');
  console.log('-----------------------------------');
  console.log('OWNER   : owner@melltool.com / Owner123!');
  console.log('MOD     : mod@melltool.com   / Mod123!');
  console.log('STAFF   : staff@melltool.com / Staff123!');
  console.log('-----------------------------------');
  console.log('\n⚠️  IMPORTANT: Change these passwords after first login!');
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
