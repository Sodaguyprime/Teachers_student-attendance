import React from 'react';
import './Stylings/MainArea.css';

const MainArea = () => {
    return (
        <div className="main-area">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="9" cy="10" r="1.5" fill="#5b4b8a"/>
                            <circle cx="15" cy="10" r="1.5" fill="#5b4b8a"/>
                            <path d="M9 14 Q12 16 15 14" stroke="#5b4b8a" strokeWidth="1.5" fill="none"/>
                        </svg>
                    </div>
                    <span className="brand-text">Dr. Tamatim von Bitches</span>
                </div>

                <div className="sidebar-profile">
                    <div className="sidebar-avatar">
                        <img src="src\1108-vibing.gif" alt="User Avatar" />
                    </div>
                    <p className="sidebar-account-text">YOUR ACCOUNT</p>
                </div>

                <nav className="sidebar-nav">
                    <a href="#dashboard" className="nav-item active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="#departments" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span>Departments</span>
                    </a>
                    <a href="#news" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>News & Events</span>
                    </a>
                    <a href="#erp" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>ERP</span>
                    </a>
                    <a href="#tasks" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6"/>
                            <line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/>
                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        <span>Tasks</span>
                    </a>
                    <a href="#requests" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Requests</span>
                    </a>
                    <a href="Login" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"/>
                        </svg>
                        <span href= "Login">Back to Login</span>
                    </a>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-info">
                        <h1>Teacher Name</h1>
                        <p>Subject: Mathematics</p>
                        <p>Employee ID: T12345</p>
                    </div>
                </div>

                <div className="profile-details">
                    <section className="contact-info">
                        <h2>Contact Information</h2>
                        <p>Email: something@smth.com</p>
                        <p>Phone: (123) 456-7890</p>
                        <p>Office: Room 069, Somewhere idk</p>
                        <p>Office Hours: Mon-Fri, 2:00 PM - 4:00 PM</p>
                    </section>

                    <section className="classes">
                        <h2>Current Classes</h2>
                        <ul>
                            <li>Class 10A - Introduction into time-travelling</li>
                            <li>Class 9B - Quantum Physics</li>
                            <li>Class 8C - Goth Dynamics</li>
                            <li>Class 11D - Advanced Mathematics</li>
                        </ul>
                    </section>

                    <section className="schedule">
                        <h2>Weekly Schedule</h2>
                        <div className="timetable">
                            <table className="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Monday</th>
                                        <th>Tuesday</th>
                                        <th>Wednesday</th>
                                        <th>Thursday</th>
                                        <th>Friday</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="time-cell">8:00 AM</td>
                                        <td className="class-cell">10A Math</td>
                                        <td className="class-cell">9B Math</td>
                                        <td className="class-cell">10A Math</td>
                                        <td className="class-cell">8C Math</td>
                                        <td className="class-cell">11D Math</td>
                                    </tr>
                                    <tr>
                                        <td className="time-cell">10:00 AM</td>
                                        <td className="class-cell">9B Math</td>
                                        <td className="free-cell">Free Period</td>
                                        <td className="class-cell">11D Math</td>
                                        <td className="class-cell">10A Math</td>
                                        <td className="class-cell">9B Math</td>
                                    </tr>
                                    <tr>
                                        <td className="time-cell">1:00 PM</td>
                                        <td className="class-cell">8C Math</td>
                                        <td className="class-cell">10A Math</td>
                                        <td className="free-cell">Free Period</td>
                                        <td className="class-cell">9B Math</td>
                                        <td className="class-cell">8C Math</td>
                                    </tr>
                                    <tr>
                                        <td className="time-cell">2:00 PM</td>
                                        <td className="office-cell">Office Hours</td>
                                        <td className="office-cell">Office Hours</td>
                                        <td className="office-cell">Office Hours</td>
                                        <td className="office-cell">Office Hours</td>
                                        <td className="office-cell">Office Hours</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="achievements">
                        <h2>Recent Achievements</h2>
                        <ul className="achievements-list">
                            <li>- Best Teacher Award 2024</li>
                            <li>- Published research paper on Mathematics Education</li>
                            <li>- 100% student pass rate in final exams</li>
                        </ul>
                    </section>

                    <section className="announcements">
                        <h2>Important Announcements</h2>
                        <div className="announcement-item">
                            <p className="announcement-date">Oct 15, 2025</p>
                            <p>Parent-Teacher meeting scheduled for next week</p>
                        </div>
                        <div className="announcement-item">
                            <p className="announcement-date">Oct 12, 2025</p>
                            <p>Mid-term examination results are now available</p>
                        </div>
                        <div className="announcement-item">
                            <p className="announcement-date">Oct 10, 2025</p>
                            <p>Faculty training workshop on new teaching methods</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MainArea;