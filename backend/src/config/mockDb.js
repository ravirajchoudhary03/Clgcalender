// Mock in-memory database for demo mode
// This allows the app to run without MongoDB

const mockDb = {
  users: {
    "000000000000000000000001": {
      _id: "000000000000000000000001",
      name: "John Student",
      email: "student@example.com",
      // password is: password123
      password: "$2a$10$UgXxn8aOM0moVOsK6uFuuO3iPkTtml3pWylYQueD/M.cj2UhSfOgq",
      createdAt: new Date("2024-01-01"),
    },
  },
  habits: {
    1: {
      _id: "1",
      user_id: "000000000000000000000001",
      title: "Morning Exercise",
      color: "#FF6B6B",
      createdAt: new Date("2024-01-01"),
    },
    2: {
      _id: "2",
      user_id: "000000000000000000000001",
      title: "Read 30 mins",
      color: "#4ECDC4",
      createdAt: new Date("2024-01-02"),
    },
    3: {
      _id: "3",
      user_id: "000000000000000000000001",
      title: "Study DSA",
      color: "#45B7D1",
      createdAt: new Date("2024-01-03"),
    },
  },
  habitLogs: {
    1: {
      _id: "1",
      user_id: "000000000000000000000001",
      habit_id: "1",
      date: "2024-01-15",
      completed: true,
    },
    2: {
      _id: "2",
      user_id: "000000000000000000000001",
      habit_id: "2",
      date: "2024-01-15",
      completed: true,
    },
    3: {
      _id: "3",
      user_id: "000000000000000000000001",
      habit_id: "3",
      date: "2024-01-15",
      completed: false,
    },
  },
  subjects: {
    1: {
      _id: "1",
      user_id: "000000000000000000000001",
      name: "Data Structures",
      totalClasses: 20,
      classesAttended: 18,
      color: "#F38181",
    },
    2: {
      _id: "2",
      user_id: "000000000000000000000001",
      name: "Web Development",
      totalClasses: 15,
      classesAttended: 14,
      color: "#AA96DA",
    },
    3: {
      _id: "3",
      user_id: "000000000000000000000001",
      name: "Database Design",
      totalClasses: 18,
      classesAttended: 16,
      color: "#FCBAD3",
    },
  },
  attendanceLogs: {
    1: {
      _id: "1",
      user_id: "000000000000000000000001",
      subject_id: "1",
      date: "2024-01-15",
      status: "attended",
    },
    2: {
      _id: "2",
      user_id: "000000000000000000000001",
      subject_id: "2",
      date: "2024-01-15",
      status: "attended",
    },
    3: {
      _id: "3",
      user_id: "000000000000000000000001",
      subject_id: "3",
      date: "2024-01-15",
      status: "missed",
    },
  },
  schedules: {
    1: {
      _id: "1",
      user_id: "000000000000000000000001",
      day: "Monday",
      time: "09:00",
      subject_id: "1",
    },
    2: {
      _id: "2",
      user_id: "000000000000000000000001",
      day: "Tuesday",
      time: "11:00",
      subject_id: "2",
    },
    3: {
      _id: "3",
      user_id: "000000000000000000000001",
      day: "Wednesday",
      time: "14:00",
      subject_id: "3",
    },
  },
  classInstances: {},
  nextId: {
    users: 2,
    habits: 4,
    habitLogs: 4,
    subjects: 4,
    attendanceLogs: 4,
    schedules: 4,
    classInstances: 1,
  },
};

module.exports = mockDb;
