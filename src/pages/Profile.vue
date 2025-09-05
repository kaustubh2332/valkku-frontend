<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon class="me-2">mdi-account</v-icon>
            Profile Management
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" class="text-center">
                <v-avatar size="120" class="mb-4">
                  <v-img
                    v-if="user?.picture"
                    :src="user.picture"
                    :alt="user.name || 'User'"
                  ></v-img>
                  <v-icon size="60" v-else>mdi-account</v-icon>
                </v-avatar>
              </v-col>
            </v-row>

            <div class="text-center mb-6">
              <h3 class="text-h6 mb-2">{{ user?.name || 'User' }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ user?.email }}</p>
            </div>

            <v-alert
              type="info"
              variant="tonal"
              class="mb-6"
            >
              <template v-slot:prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              To update your profile information, password, or security settings, please visit the Auth0 dashboard.
            </v-alert>

            <div class="d-flex justify-center">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="goToAuth0Dashboard"
              >
                Open Auth0 Dashboard
              </v-btn>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              @click="$router.push('/')"
            >
              Back to Home
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useAuth0 } from '@auth0/auth0-vue'

const { user } = useAuth0()

const goToAuth0Dashboard = () => {
  // Open Auth0 user profile management in a new tab
  window.open('https://valkku.eu.auth0.com/user/profile', '_blank')
}
</script>
