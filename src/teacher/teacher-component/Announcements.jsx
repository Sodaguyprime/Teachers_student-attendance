import React from "react";

const Announcements = () => {
    return (<>
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
        </>)
}
export default Announcements;