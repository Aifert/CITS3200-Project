### **User Manual for CITS3200 Project**

---

#### **Project Summary**

The project is a Remote Radio Monitoring Solution, designed to facilitate real-time monitoring of radio traffic using a mobile temporary radio repeater. The solution enables remote analysis and interaction with the radio channels through an intuitive web interface, displaying important channel analytics such as signal strength and utilization.

#### **Key Technologies:**

* **Next.js** for the frontend development.  
* **Docker** to run the application locally and in production.  
* **EntraID (Azure Active Directory)** for user authentication.  
* **Chart.js** for visualizing the data.

This project is part of a broader effort to modernize remote radio monitoring systems and integrate secure user authentication with industry-standard tools like Azure AD.

---

#### **Introduction**

This user manual provides a step-by-step guide for setting up and using the CITS3200 Project. This guide is meant for new users or developers who are unfamiliar with the system, detailing everything from installation to using the key features.

* **Launching the Production Server**  
* **Running the Hardware**  
* **Configuring EntraID Authentication**  
* **Usage Guide**

---

### **1\. Launching the Production Server (Aifert)**

This section will guide you through the steps needed to deploy and launch the production server for the CITS3200 web application on Azure Web App Services. Follow the instructions below to set up your production environment, deploy the app, and access the production system.

#### **Steps for Setting Up the Production Environment:**

1. **Log in to the Azure Portal**  
   Go to [Azure Portal](https://portal.azure.com) and sign in to your account.  
2. **Navigate to the Web App Resource**  
   * Go to "Resource Groups" and find the resource group where your web app was created.  
   * Click on the **Web App** resource you created (e.g., `cits3200-web-app`).  
3. **Configure Deployment Settings**  
   * Under the **Deployment Center**, ensure that the CI/CD pipeline is set up correctly with GitHub Actions.  
   * Verify that your Docker Hub repository is linked to Azure via the webhook, so that new Docker images trigger automatic deployments.  
4. **Verify Docker Compose Configuration**  
   * Ensure that your `docker-compose.yml` file is correctly defined to pull both the backend and frontend images from Docker Hub.  
5. **Update Environment Variables**  
   Set up environment variables in Azure under the **Configuration** section to match the required keys for your app. This includes:  
   * `NEXTAUTH_URL`  
   * `NEXT_PUBLIC_BACKEND_URL`  
   * `NEXT_PUBLIC_SDR_URL`  
   * Azure AD configuration (if applicable for authentication)  
6. More detailed instructions and code examples are provided in [Deployment README](https://github.com/Aifert/CITS3200-Project/blob/deployment/README/deployment_README.md).

   #### **Commands to Deploy the App:**

1. **Push Changes to GitHub**  
   Make sure your project is up to date in your GitHub repository. Once changes are committed and pushed, GitHub Actions should trigger an automatic deployment to Azure.  
2. **Manually Trigger a Deployment**  
   If needed, you can manually trigger a deployment by:  
   * Going to the **Deployment Center** in Azure.  
   * Clicking on the **Sync** button to pull the latest Docker images and deploy them.

   #### **Accessing the Production System:**

1. **Access the Frontend**  
   Once the deployment is successful, you can access the frontend via the URL provided by Azure (e.g., `https://cits3200-web-app.azurewebsites.net`).  
2. **Access the Backend**  
   For backend API access, visit the corresponding endpoint (e.g., `https://cits3200-web-app.azurewebsites.net/api`).  
3. **Verify Authentication (EntraID)**  
   If EntraID (Azure Active Directory) is configured, test the login functionality to ensure users can sign in using their Azure AD credentials.

By following these steps, you will have successfully launched your production server for the CITS3200 web app on Azure.

* 

---

### **2\. Running the Hardware (Henry)**

*This section will explain how to run the necessary hardware for the system.*

If you are responsible for setting up the system on chip (SoC) devices, you will need to complete the following steps:

1. **Collect Required Equipment:**  
   * 1x SoC device (Raspberry Pi 5 Model B)  
   * 2x RTL-SDRv4  
   * 1x wide USB hub  
   * 1x USB (FAT32 format)  
2. **Move a copy of the rasp-pi directory to the SoC.**  
3. **Follow the instructions in rasp-pi/README.md for a one-time SoC configuration.**  
4. **Setting up in the field:**  
   * Ensure your USB is loaded with a correct config.txt file and the SESChannelList.csv files in the root directory.  
   * Place the SoC near the repeater, where it has power & is within range of the router (router credentials should be loaded in config.txt on the USB by this point).  
   * Before powering on, plug in the USB and wide USB hub, and plug the 2x RTL-SDRv4 in wherever they can fit.  
   * Take the antenna & extend them fully, using the suction locks to attach them to whatever you can, such that they are elevated with the antenna facing vertically, one to the sky & the other to the floor.  
   * Power on the SoC, which should launch everything on boot as per the USB settings.  
   * Verify that data is coming through on the server after the device has been running for 2 minutes.  
5. **Troubleshooting**  
   * If you are having issues connecting to the router, plug in a monitor via the HDMI connection on the SoC, and check if the network has connected on boot as per the desktop environment.  
   * If you update the config.txt file on USB you must reboot the SoC while it is plugged in for changes to take place.  
     1. Once the device has been running for 2 minutes the USB can be removed, it will not affect its operation (though must be returned for reboot).  
   * The wide USB hub is only to allow space to plug in RTL-SDRv4 USBs since they are enormous, it makes no difference to the functionality otherwise.

---

### **3\. Authentication Setup (EntraID)**

For users, the system integrates with Azure Active Directory (AAD) via EntraID authentication to allow secure access based on your organization’s login credentials. This guide assumes the production environment has been configured with the necessary Client ID, Tenant ID, and Client Secret. If these values have not been configured, follow the steps below to configure the EntraId integration.

### **3.1. Administrator Setup (For Production Deployment)**

If you are responsible for setting up the production environment, you will need to complete the following steps:

1. **Register the Application with Azure Active Directory (AAD)**:  
   * Log into your Azure portal and go to "Azure Active Directory."  
   * Register a new application for your system.  
   * Record the **Client ID**, **Tenant ID**, and **Client Secret**.  
2. **Configure Redirect URIs**:  
   * Set up the redirect URI in Azure to match the production URL of your application (e.g., `https://yourappdomain.com/api/auth/callback/azure-ad`).  
3. **Environment Variables**:  
   Ensure that the following environment variables are properly set in the `.env` file in the project root for production deployment:  
     
   \`\`\`bash  
   `NEXTAUTH_URL=https://yourappdomain.com`  
   `AZURE_AD_CLIENT_ID=<Your Client ID>`  
   `AZURE_AD_CLIENT_SECRET=<Your Client Secret>`  
   `AZURE_AD_TENANT_ID=<Your Tenant ID>`

	\`\`\`

4. **Deploy the System**:  
   * After setting up the credentials and environment variables, deploy the application to the production environment.

---

### **3.2. EntraID Authentication for Regular Users**

Regular users **do not** need to worry about configuring EntraID, they simply need authorized login credentials to login.

---

### **4\. Usage Guide**

This section provides an overview of the user-facing features of the frontend, guiding through the analytics, monitoring and key interactions.

### **4.1. Navbar Overview**

The **Navbar** provides users with easy access to key sections of the application. It is designed to remain visible at the top of the page, allowing users to navigate between pages, view notifications, and manage their account without having to scroll or search for navigation links.

The Navbar is divided into two main sections:

* The **left side** contains logos and navigation links for different parts of the system.  
* The **right side** contains the notification bell, a link to the API key page, and a logout button.

#### **4.1.1. Logos**

* **SWORD Logo**:  
  The logo on the left links to the [Communications Support Unit (CSU) website](https://csu-ses.com.au/). Clicking this logo will open the CSU website in a new tab.  
* **Department of Fire and Emergency Services (DFES) Logo**:  
  The DFES logo links to the [DFES website](https://dfes.wa.gov.au/), also opening in a new tab. These logos help identify the organizations involved in the project.

#### **4.1.2. Navigation Links**

The following navigation links allow users to switch between key pages:

* **Channel Listening**:  
  Clicking this link takes users to the **Channel Listening** page, where they can listen to live radio traffic from available channels. The link is highlighted in bold when the user is on the **Channel Listening** page, providing visual feedback on the current location.  
* **Analytics**:  
  Clicking this link takes users to the **Analytics** page, where they can view detailed data about channel utilization, signal strength, and other metrics. As with the **Channel Listening** link, the **Analytics** link is bolded when the user is currently viewing the analytics page.

#### **4.1.3. Notification Bell**

* **Notifications**:  
  The **Notification Bell** is located on the right side of the navbar. This bell icon indicates any new notifications related to the user's channels. Users can configure notifications to alert them about specific channel activities (e.g., signal strength, usage levels) by clicking on the bell icon on the relevant page. When there are new notifications, the bell will visually indicate their presence.

#### **4.1.4. API Key Link**

* **API Key**:  
  The **API Key** link provides access to the API management page, where users can view and manage their API keys. Clicking this link directs users to the **API Key** page, where they can generate an API key to include in the when transmitting data from rasp pi to web server.  
* User-specific key generation: Each user can generate their own API key through the API Key Management page. This allows for individual control and accountability for each Raspberry Pi device associated with a user.  
* Key rotation and security: Users can generate new API keys, which invalidates old ones, allowing for periodic security updates and access control.  
* Integration with external systems: While not explicitly shown in the provided code, the API key system you've set up could be used for integrating other external systems or services with your application in a secure manner.  
* To use, simply login to the web app and go to click the API Key on the navbar to generate this token, when sending a request from raspberry pi to server using /upload/data endpoint, include this token as a bearer authorization token to be authenticated.

#### **4.1.5. Logout Button**

* **Logout**:  
  The **Logout** button allows users to securely sign out of their account. Clicking this button triggers a sign-out process, clearing authentication cookies and redirecting the user to the login page.

#### **4.1.6. Behaviour and Navigation**

The Navbar is always present at the top of the screen and uses a **sticky** positioning, meaning it remains visible even when the user scrolls down the page. This ensures that users can access navigation links, notifications, and account settings at any time during their session.

When a user clicks a navigation link, the page is reloaded with the new content, and the selected link is highlighted in bold to indicate the active page. The logout button securely ends the user's session, removing authentication tokens and redirecting them back to the login page.

---

### **4.2. Analytics Overview**

Upon logging in, users are directed to the **Analytics** page. This page displays data about radio channels, including signal strength, utilization, and status (active, busy, or offline). Key elements include:

* **Channel List**: A list of active, busy, and offline channels is displayed, each with an indication of its current status.  
* **Favorite Channels**: Users can mark channels as favorites, which will persist across sessions.  
* **Utilization and Strength Graphs**: For each channel, detailed line and scatter charts display signal strength and utilization over time.

#### **4.2.1. Favorite Channels**

* Click the ☆ icon next to any channel to mark it as a favorite. Favorited channels will move to the top of the list and remain marked for future sessions.

#### **4.2.2. Time Scale Selector and Sample Rates**

The **Time Scale Selector** allows users to change the time window over which they view the channel data. The selected time scale affects both how the data is aggregated and how often it is sampled (i.e., the **sample rate**). Depending on the selected time scale, data points are calculated based on different intervals, which provide either more detailed or more summarized data.

**Time Scales and Sample Rates**:

* For example, when the time scale is set to **24 hours**, the system samples data every **30 minutes**. This means that each data point on the graph represents the **average** signal strength and utilization for that 30-minute period.  
* If you choose a **shorter time scale** (e.g., 10 minutes), the sample rate will be finer, often as short as 1 minute, providing more detailed data.  
* For **longer time scales** (e.g., 7 days), the sample rate will be larger, such as 3 hours, meaning the data is averaged over 3-hour intervals, offering a more summarized view.

| Time Scale | Sample Rate | Description |
| :---- | :---- | :---- |
| 10 Minutes | 1 Minute | Data points are averaged over every 1 minute. |
| 60 Minutes | 5 Minutes | Data points are averaged over every 5 minutes. |
| 3 Hours | 10 Minutes | Data points are averaged over every 10 minutes. |
| 24 Hours | 30 Minutes | Data points are averaged over every 30 minutes. |
| 7 Days | 3 Hours | Data points are averaged over every 3 hours. |
| 30 Days | 24 Hours | Data points are averaged over every 24 hours. |

This mechanism allows users to view either fine-grained data (at short intervals) or a more summarized, high-level overview (at longer intervals) depending on the selected time scale.

#### **4.2.3. Data Visualizations**

For each channel, the **Utilization** and **Signal Strength** are displayed through graphs:

* **Utilization Graph**:  
  A line or scatter graph shows the percentage of utilization (the channel's activity over time) based on the selected time scale. The graph dynamically adjusts as different time scales are selected, allowing users to view detailed or summarized data.  
* **Strength Graph**:  
  A line graph represents the signal strength (in dBm) over time. Users can see how strong or weak the signal is for each channel and track any fluctuations.

#### **4.2.4. Live Listening**

* Active channels will have a **Live** button that redirects to the listening page, where users can stream the real-time audio of the radio channel.

#### **4.2.5. Notification Bell**

* Users can configure notifications for specific channels by clicking the notification bell icon next to each channel. Notifications can be set for signal strength, usage levels, or other parameters.  
* Parameters are Strength Threshold, Utilization Threshold, and Utilization Calculation time  
* The server will calculate if that channel strength is currently above the threshold, whether the utilization in the specified timeframe is above that threshold, and whether or not the channel is online.  
* The server will send notifications every time to thresholds are crossed (below→above or above → below)

#### **4.2.6. Downloading Data**

* Users can download signal strength or utilization data for any channel by clicking the download buttons. Data is available in various formats to analyze locally.

#### **4.2.7. Channel Page**

* Channel names are an interactable button, which when clicked will redirect the user to the Channel page for the clicked channel.

---

### **4.3. Channel Page Overview**

The **Channel Page** provides a detailed view of individual radio channels selected by the user. This page displays key data related to channel activity, such as signal strength, utilization, and status (active, busy, or offline). Users can interact with the channel by listening to the audio stream, adjusting volume, and viewing historical data visualizations.

The key elements of the **Channel Page** include:

* **Channel Status**: Displays the current state of the channel (e.g., Active, Busy, Offline).  
* **Channel Frequency**: Indicates the frequency of the radio channel in MHz.  
* **Utilization and Strength Graphs**: Graphical representations show signal strength and utilization over time, which adjust based on the selected time scale.  
* **Live Listening**: Users can toggle a play/pause button to listen to live radio traffic from the selected channel.  
* **Volume Control**: Users can adjust the playback volume using the volume slider.

#### **4.3.1. Time Scale Selector and Sample Rates**

* As for the analytics page, this page uses the sample time scale and sample rates. Refer to 4.1.2 for more detail.

#### **4.3.2. Live Listening**

* **Live Audio Stream**:  
  Users can click the **Play/Pause** button to start or stop the live audio stream of the selected radio channel. When activated, the button will turn green, and the audio will play through the browser. Clicking again pauses the stream, turning the button red.

#### **4.3.3. Volume Control**

* **Volume Slider**:  
  Users can adjust the playback volume of the live audio stream using the slider. The volume level is displayed as a percentage, allowing for fine-tuned control over audio output.

#### **4.3.4. Data Visualizations**

* These graph are copies of graphs that are displayed in the Analytics pag, refer to 4.2.3 for detailed information

#### **4.2.5. Adding Channels**

* Users can add additional valid channels to the page using the **Add Channel** dropdown menu. Selecting a channel from the list will refresh the page, including the new channel's data in the view. If all channels are already present, the dropdown menu will empty and unresponsive

#### **4.2.6. Downloading Data**

* Similar to the analytics page, all data for the channels present in the page is downloadable via the two download buttons present near the top of the page.

---

### **4.4. Monitor Page/ Channel Listening Page Overview**

The **Channel Listening Page** provides a simple overview of individual radio channels currently available. This page displays every channel’s activity data, such as signal strength, utilization, and status (active, busy, or offline) as well as providing audio streaming capabilities, with play/pause, and volume control features.

The key elements of the **Channel Page** include:

* **Channel Status**: Displays the current state of the channel (e.g., Active, Busy, Offline).  
* **Channel Frequency**: Indicates the frequency of the radio channel in MHz.  
* **Utilization and Strength Graphs**: Graphical representations show signal strength and utilization over time, which adjust based on the selected time scale.  
* **Live Listening**: Users can toggle a play/pause button to listen to live radio traffic from the selected channel.  
* **Volume Control**: Users can adjust the playback volume using the volume slider.

#### **4.3.1. Live Listening**

* **Live Audio Stream**:  
  Users can click the **Play/Pause** button to start or stop the live audio stream of the selected radio channel. When activated, the button will turn green, and the audio will play through the browser. Clicking again pauses the stream, turning the button red.

#### **4.3.2. Volume Control**

* **Volume Slider**:  
  Users can adjust the playback volume of the live audio stream using the slider for a specific channel. The volume level is displayed as a percentage, allowing for fine-tuned control over audio output.  
* **Global Volume Slider**:  
  Users can adjust the playback volume of the entire page if multiple streams are playingl. The volume level is displayed as a percentage, allowing for fine-tuned control over audio output.