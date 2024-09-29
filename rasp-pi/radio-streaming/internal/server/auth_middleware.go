package server

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
)

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("next-auth.session-token")
        if err != nil {
            redirectToLogin(w, r)
            return
        }

        sessionToken := cookie.Value

        accessToken, err := getAccessTokenFromSession(sessionToken)
        if err != nil || accessToken == "" {
            redirectToLogin(w, r)
            return
        }

        next.ServeHTTP(w, r)
    }
}

func redirectToLogin(w http.ResponseWriter, r *http.Request) {
    loginURL := fmt.Sprintf("http://localhost:3000/login?requestedUrl=%s&port=8001", url.QueryEscape(r.URL.String()))
    http.Redirect(w, r, loginURL, http.StatusTemporaryRedirect)
}

func getAccessTokenFromSession(sessionToken string) (string, error) {
    sessionApiUrl := "http://localhost:3000/api/auth/session"
    req, err := http.NewRequest("GET", sessionApiUrl, nil)
    if err != nil {
        return "", err
    }

    req.AddCookie(&http.Cookie{
        Name:  "next-auth.session-token",
        Value: sessionToken,
    })

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return "", fmt.Errorf("session API responded with status: %d", resp.StatusCode)
    }

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }

    var sessionData map[string]interface{}
    if err := json.Unmarshal(body, &sessionData); err != nil {
        return "", err
    }

    if accessToken, ok := sessionData["accessToken"].(string); ok {
        return accessToken, nil
    }

    return "", fmt.Errorf("accessToken not found in session")
}
