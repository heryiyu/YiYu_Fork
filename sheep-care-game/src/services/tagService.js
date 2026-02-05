import { supabase } from './supabaseClient';

export const tagService = {
    async loadTags(userId) {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('sheep_tags')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error loading tags:', error);
            return [];
        }
        return data || [];
    },

    async loadTagAssignments(userId) {
        if (!userId) return {};
        const { data, error } = await supabase
            .from('sheep_tag_assignments')
            .select('sheep_id, tag_id, order_index')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });
        if (error) {
            console.error('Error loading tag assignments:', error);
            return {};
        }
        const bySheep = {};
        (data || []).forEach(({ sheep_id, tag_id, order_index }) => {
            if (!bySheep[sheep_id]) bySheep[sheep_id] = [];
            bySheep[sheep_id].push({ tagId: tag_id, orderIndex: order_index });
        });
        Object.keys(bySheep).forEach(sid => {
            bySheep[sid].sort((a, b) => a.orderIndex - b.orderIndex);
        });
        return bySheep;
    },

    async createTag(userId, { name, color = '#6b7280', isDefault = false }) {
        if (!userId || !name?.trim()) return null;
        const { data, error } = await supabase
            .from('sheep_tags')
            .insert([{ user_id: userId, name: name.trim(), color, is_default: isDefault }])
            .select()
            .single();
        if (error) {
            console.error('Error creating tag:', error);
            return null;
        }
        return data;
    },

    async updateTag(tagId, { name, color }) {
        if (!tagId) return null;
        const payload = { updated_at: new Date().toISOString() };
        if (name !== undefined) payload.name = name.trim();
        if (color !== undefined) payload.color = color;
        const { data, error } = await supabase
            .from('sheep_tags')
            .update(payload)
            .eq('id', tagId)
            .select()
            .single();
        if (error) {
            console.error('Error updating tag:', error);
            return null;
        }
        return data;
    },

    async deleteTag(tagId) {
        if (!tagId) return false;
        const { error } = await supabase.from('sheep_tags').delete().eq('id', tagId);
        if (error) {
            console.error('Error deleting tag:', error);
            return false;
        }
        return true;
    },

    async setSheepTags(sheepId, userId, tagIds) {
        if (!sheepId || !userId) return false;
        const existing = await supabase
            .from('sheep_tag_assignments')
            .delete()
            .eq('sheep_id', sheepId);
        if (existing.error) {
            console.error('Error clearing assignments:', existing.error);
            return false;
        }
        if (!tagIds || tagIds.length === 0) return true;
        const rows = tagIds.map((tagId, i) => ({
            sheep_id: sheepId,
            tag_id: tagId,
            user_id: userId,
            order_index: i
        }));
        const { error } = await supabase.from('sheep_tag_assignments').insert(rows);
        if (error) {
            console.error('Error setting sheep tags:', error);
            return false;
        }
        return true;
    }
};
