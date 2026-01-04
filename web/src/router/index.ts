import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import BurgersView from "../views/BurgersView.vue";
import BurgerDetailView from "../views/BurgerDetailView.vue";
import EpisodesView from "../views/EpisodesView.vue";
import EpisodeDetailView from "../views/EpisodeDetailView.vue";
import NotFoundView from "../views/NotFoundView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/burgers", name: "burgers", component: BurgersView },
    {
      path: "/burgers/:slug",
      name: "burger",
      component: BurgerDetailView,
      props: true,
    },
    { path: "/episodes", name: "episodes", component: EpisodesView },
    {
      path: "/episodes/:code",
      name: "episode",
      component: EpisodeDetailView,
      props: true,
    },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
