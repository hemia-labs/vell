<script setup lang="ts">
defineProps<{
  user: any
}>()
</script>

<template>
  <div class="flex min-w-65 items-center gap-2.75">
    <span class="user-avatar" :class="[user.avatarClass, `presence-${user.presence}`]">{{ user.initials }}</span>
    <span class="flex min-w-0 flex-col">
      <span class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-(--app-ink)">
        {{ user.name }}
      </span>
      <span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-(--app-muted)">{{ user.email }}</span>
    </span>
  </div>
</template>

<style scoped>
.user-avatar {
  position: relative;
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 650;
}

.user-avatar::after {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border: 2px solid var(--app-surface);
  border-radius: 999px;
  background: #3ba55c;
  content: '';
}

.presence-away::after {
  background: #d4b055;
}

.presence-offline::after {
  background: var(--app-muted-2);
}

.presence-pending::after {
  background: var(--app-accent-ink);
  opacity: 0.55;
}

.avatar-warm { background: linear-gradient(135deg, #c9bfa7, #7a6f5a); }
.avatar-blue { background: linear-gradient(135deg, #7a8da3, #3e5368); }
.avatar-sand { background: linear-gradient(135deg, #d6cfc2, #9a8b6b); }
.avatar-graphite { background: linear-gradient(135deg, #3e4650, #1f252e); }
.avatar-gold { background: linear-gradient(135deg, #b8a47a, #6f5e3a); }
.avatar-moss { background: linear-gradient(135deg, #a89b82, #635742); }
.avatar-brown { background: linear-gradient(135deg, #7a6f5a, #403828); }
.avatar-earth { background: linear-gradient(135deg, #9a8b6b, #4b4130); }
.avatar-pending {
  background: linear-gradient(135deg, #e7e3d9, #b8a47a);
  color: #5a5142;
}
.avatar-slate { background: linear-gradient(135deg, #6a6e78, #2b2e36); }
</style>