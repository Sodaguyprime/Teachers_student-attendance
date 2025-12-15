import React from 'react';
import './Stylings/MainArea.css';
import Announcements from './teacher-component/Announcements'
import Achievements from "./teacher-component/Achievements";
import Sidebar from "./teacher-component/Sidebar";
const MainArea = () => {
    return (
        <div className="main-area">
            <aside className="sidebar">
                <Sidebar/>
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
                </div>
            </div>
        </div>
    );
};

export default MainArea;