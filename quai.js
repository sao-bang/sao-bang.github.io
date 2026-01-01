import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const ENEMY_TYPES = {
    NORMAL: { name: 'Z-Runner', speed: 8, detectRange: 40, attackRange: 4, hp: 100, color: 0x00ff00, interval: 1000, damage: 10 },
    SNIPER: { name: 'Shadow-Eye', speed: 3, detectRange: 100, attackRange: 60, hp: 80, color: 0x3333ff, interval: 3500, damage: 45 },
    BOSS: { name: 'GOLIATH', speed: 5, detectRange: 150, attackRange: 15, hp: 1000, color: 0xff0000, interval: 2000, damage: 25 }
};

export class EnemyManager {
    constructor(scene, collidableObjects) {
        this.scene = scene;
        this.enemies = [];
        this.collidableObjects = collidableObjects;
        this.projectiles = [];
    }

    createHPTexture(hp, maxHp) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 128, 16);
        const ratio = hp / maxHp;
        ctx.fillStyle = ratio > 0.5 ? '#00ff88' : '#ff4655';
        ctx.fillRect(2, 2, ratio * 124, 12);
        return new THREE.CanvasTexture(canvas);
    }

    spawnEnemy(type, pos) {
        const group = new THREE.Group();
        
        // Body (Capsule cho mượt)
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: type.color }));
        body.position.y = 1;
        body.userData = { part: 'body', parent: group };
        group.add(body);

        // Head (Headshot zone)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
        head.position.y = 2;
        head.userData = { part: 'head', parent: group };
        group.add(head);

        const hpBar = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.createHPTexture(type.hp, type.hp) }));
        hpBar.scale.set(1.5, 0.2, 1); hpBar.position.y = 2.7;
        group.add(hpBar);

        group.position.copy(pos);
        group.userData = { config: type, hp: type.hp, maxHp: type.hp, lastShot: 0, hpBar: hpBar, isDead: false };
        this.scene.add(group); this.enemies.push(group);
    }

    update(delta, playerPos, onPlayerHit) {
        const time = Date.now();
        this.enemies.forEach((enemy, index) => {
            if (enemy.userData.isDead) return;
            const dist = enemy.position.distanceTo(playerPos);
            enemy.userData.hpBar.material.map = this.createHPTexture(enemy.userData.hp, enemy.userData.maxHp);

            if (dist < enemy.userData.config.detectRange) {
                enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);
                if (dist > enemy.userData.config.attackRange) {
                    const moveDir = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
                    enemy.position.add(moveDir.multiplyScalar(enemy.userData.config.speed * delta));
                }
                if (dist <= enemy.userData.config.attackRange && time - enemy.userData.lastShot > enemy.userData.config.interval) {
                    onPlayerHit(enemy.userData.config.damage);
                    enemy.userData.lastShot = time;
                }
            }
        });
    }
}