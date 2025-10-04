<template>
  <div>
    <v-form @submit.prevent="save">
      <v-row>
        <v-col class="mb-4" cols="12">
          <v-autocomplete
            ref="locAutocomplete"
            v-model="selectedSuggestion"
            v-model:menu="suggestionsMenu"
            v-model:search="searchText"
            append-inner-icon="mdi-magnify"
            autocomplete="off"
            clearable
            density="compact"
            hide-details="auto"
            item-title="description"
            item-value="placeId"
            :items="suggestions"
            :label="$t('events.search_location') || 'Search location'"
            :loading="loading"
            :menu-props="{ zIndex: dropdownZIndex }"
            :no-filter="true"
            rounded
            variant="outlined"
            @update:model-value="onPickSuggestion"
            @update:search="onSearch"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" @click="onPickSuggestion(item.raw)">
                <template #title>
                  {{ item?.raw.displayName?.text }}
                </template>
                <template #subtitle>
                  {{ item?.raw?.formattedAddress }}
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.name"
            clearable
            hide-details="auto"
            :label="$t('events.location_name') || 'Name'"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.formattedAddress"
            clearable
            hide-details="auto"
            :label="$t('events.address') || 'Address'"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </v-form>

    <div class="d-flex justify-end ga-2 mt-2">
      <v-btn variant="text" @click="$emit('close')">{{ $t('cancel') }}</v-btn>
      <v-btn color="primary" :loading="saving" @click="save">{{ $t('save') }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useZIndex } from '@/composables/useZIndex'
  import { useNotificationStore } from '@/stores/notification'
  import api from '@/utils/axios'

  export default {
    name: 'CreateLocation',
    components: {},
    props: {
      teamId: {
        type: [String, Number],
        required: true
      }
    },
    emits: ['created', 'close'],
    setup() {
      const notificationStore = useNotificationStore()
      const handleBackendError = notificationStore.handleBackendError
      const { locale } = useI18n()
      return { locale, handleBackendError }
    },
    data() {
      return {
        searchText: '',
        selectedSuggestion: null as any,
        suggestionsMenu: false,
        suggestions: [] as any[],
        loading: false,
        saving: false,
        suppressSearch: false,
        form: {
          name: '',
          formattedAddress: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          lat: null as any,
          lon: null as any,
          provider: 'google',
          providerPlaceId: ''
        }
      }
    },
    computed: {
      dropdownZIndex() {
        const { calculateZIndex } = useZIndex()
        return calculateZIndex(30_000)
      },
    },
    methods: {

      async onSearch(q: string) {
        if (this.suppressSearch) {
          this.suppressSearch = false
          return
        }
        try {
          this.searchText = q
          if (!q || q.trim().length < 2) {
            this.suggestions = []
            return
          }
          this.loading = true
          const res = await api.get(`/location/suggest/language/${this.locale}`, { params: { q } })
          const raw = Array.isArray(res?.data?.data) ? res.data.data : []
          this.suggestions = raw.map((s: any) => ({
            ...s,
            description: s?.displayName?.text || s?.mainText || s?.name || s?.description || ''
          }))
          this.suggestionsMenu = this.suggestions.length > 0
        } catch (error) {
          console.error('Suggest failed', error)
        } finally {
          this.loading = false
        }
      },
      onPickSuggestion(val: any) {
        const s = val && typeof val === 'object' ? val : this.suggestions.find((i: any) => i.placeId === val)
        if (!s) return
        // Parse address components into form fields
        const parseAddressComponents = (arr: any[]) => {
          const find = (t: string) => (arr || []).find((c: any) => Array.isArray(c?.types) && c.types.includes(t))
          const streetNumber = find('street_number')?.longText || ''
          const route = find('route')?.longText || ''
          const addressLine1 = [route, streetNumber].filter(Boolean).join(' ').trim()
          const city = (find('locality')?.longText)
            || (find('administrative_area_level_3')?.longText)
            || (find('administrative_area_level_2')?.longText)
            || ''
          const state = (find('administrative_area_level_1')?.longText) || ''
          const zip = (find('postal_code')?.longText) || ''
          const countryComp = find('country')
          const country = (countryComp?.shortText) || (countryComp?.longText) || ''
          return { addressLine1, city, state, zip, country }
        }

        const addr = parseAddressComponents(s.addressComponents || [])

        this.form = {
          ...this.form,
          name: (s.displayName && s.displayName.text) || s.mainText || s.description,
          formattedAddress: s.formattedAddress || s.description,
          addressLine1: addr.addressLine1 || this.form.addressLine1,
          city: addr.city || this.form.city,
          state: addr.state || this.form.state,
          zip: addr.zip || this.form.zip,
          country: addr.country || this.form.country,
          providerPlaceId: s.placeId,
          lon: s?.location?.longitude ?? this.form.lon,
          lat: s?.location?.latitude ?? this.form.lat
        }
        // Prevent v-autocomplete from re-triggering a search due to display text update
        this.suppressSearch = true
        this.selectedSuggestion = s
        this.suggestionsMenu = false
        // Clear suggestions to ensure menu stays closed and blur input to dismiss overlay
        this.suggestions = []
        this.searchText = ''
        this.$nextTick(() => {
          const input = (this.$refs.locAutocomplete as any)?.$el?.querySelector('input')
          if (input && typeof input.blur === 'function') input.blur()
        })
      },
      async save() {
        if (!this.teamId) return
        this.saving = true
        try {
          await api.post(`/location/team/${this.teamId}`, this.form)
          // Emit enough info to reliably select the newly created location
          this.$emit('created', {
            providerPlaceId: this.form.providerPlaceId,
            name: this.form.name,
            formattedAddress: this.form.formattedAddress,
            lat: this.form.lat,
            lon: this.form.lon
          })
        } catch (error) {
          this.handleBackendError(error)
          console.error('Create location failed', error)
        } finally {
          this.saving = false
        }
      }
    }
  }
</script>

<style scoped>
</style>
