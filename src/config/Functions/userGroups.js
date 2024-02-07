const getUserGroups = async () => {
    try {
        const parsedAccessToken = localStorage.getItem('token');
        const response = await fetch('https://p8u4dzxbx2uzapo8hev0ldeut0xcdm.pythonanywhere.com/user-groups/', {
            method: 'GET',
            headers: {
                Authorization: `Token ${parsedAccessToken}`,
            },
        });

        console.log('Response:', response);

        if (response.ok) {
            const data = await response.json();
            console.log('Data:', data); // Log the data received from the server

            if (data && Array.isArray(data) && data.length > 0) {
                console.log('User groups retrieved successfully.');
                localStorage.setItem('userGroups', JSON.stringify(data));
                return data;
            } else {
                console.log('No groups found.');
                return [];
            }
        } else {
            console.error('Unexpected response from server:', response);
            return null;
        }
    } catch (error) {
        console.error('Error retrieving user groups:', error);
        return null;
    }
};

export default getUserGroups;
